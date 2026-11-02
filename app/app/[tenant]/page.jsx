'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function getLocalProducts(tenantId){ try{ return JSON.parse(localStorage.getItem(`pos_products_${tenantId}`)||'[]'); }catch{ return []; } }
function getLocalCustomers(tenantId){ try{ return JSON.parse(localStorage.getItem(`pos_customers_${tenantId}`)||'[]'); }catch{ return []; } }
function getPendingSales(){ try{ return JSON.parse(localStorage.getItem('pos_pending_sales')||'[]'); }catch{ return []; } }
function getDailyStats(tenantId){ try{ return JSON.parse(localStorage.getItem(`pos_daily_stats_${tenantId}`)||'null'); }catch{ return null; } }
function saveDailyStats(tenantId, stats){ localStorage.setItem(`pos_daily_stats_${tenantId}`, JSON.stringify(stats)); }
function updateDailyStatsOffline(tenantId, salePayload){
  const today = new Date().toISOString().split('T')[0];
  let daily = getDailyStats(tenantId);
  if(!daily || daily.date!==today){ daily = { date: today, todaySales:0, todayProfit:0, efectivo:0, fiado:0, abonos:0, countSales:0 }; }
  const isAbono = salePayload.payment_type==='abono';
  if(!isAbono) daily.todaySales += salePayload.total;
  daily.todayProfit += salePayload.profit;
  if(salePayload.payment_type==='efectivo') daily.efectivo+=salePayload.total;
  if(salePayload.payment_type==='fiado') daily.fiado+=salePayload.total;
  if(salePayload.payment_type==='abono') daily.abonos+=salePayload.total;
  daily.countSales+=1;
  saveDailyStats(tenantId, daily);
  return daily;
}

export default function PosPageV11_4({ params }) {
  const tenantId = params.tenant;
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [searchConfig, setSearchConfig] = useState('');
  const [stats, setStats] = useState({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
  const [closures, setClosures] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [sparkData, setSparkData] = useState([0,0,0,0,0,0,0]);
  const [auth, setAuth] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('pos');
  const [configTab, setConfigTab] = useState('clientes');
  const [editingProd, setEditingProd] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAbonos, setShowAbonos] = useState(false);
  const [newProd, setNewProd] = useState({ name:'', sell_price:'', cost_price:'', stock:'' });
  const [newCust, setNewCust] = useState({ name:'', phone:'' });
  const [abonoData, setAbonoData] = useState({ customerId:'', amount:'' });
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [now, setNow] = useState(new Date());
  const [cartFlash, setCartFlash] = useState(false);
  const cartRef = useRef(null);
  const ADMIN_PIN = '1234'; const EMPLEADO_PIN = '0000';

  useEffect(() => {
    window.history.replaceState({ view: 'pos' }, '', window.location.pathname);
    const onPopState = () => { setView('pos'); setShowTicketModal(false); window.history.pushState({ view: 'pos' }, '', window.location.pathname); };
    window.addEventListener('popstate', onPopState);
    const handleOnline = () => { setIsOnline(true); setTimeout(()=>syncPending(), 1000); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    setPendingCount(getPendingSales().length);
    const clock = setInterval(()=>setNow(new Date()), 1000);
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); clearInterval(clock); };
  }, []);

  const goToConfig = () => { setView('config'); window.history.pushState({ view: 'config' }, '', window.location.pathname + '#config'); };
  const goToPos = () => { setView('pos'); if (window.location.hash === '#config') window.history.back(); else window.history.replaceState({ view: 'pos' }, '', window.location.pathname); };

  useEffect(() => {
    const saved = localStorage.getItem(`pos_auth_${tenantId}`);
    if(saved) setAuth(JSON.parse(saved));
    loadAll();
  }, []);

  async function ensureProductRemote(product, tenantId){
    if(!product.id.startsWith('local_')) return product.id;
    const { data: existing } = await supabase.from('pos_products').select('id').eq('tenant_id', tenantId).eq('name', product.name).maybeSingle();
    if(existing) return existing.id;
    const { data: created, error } = await supabase.from('pos_products').insert({
      tenant_id: tenantId, name: product.name, sell_price: product.sell_price, cost_price: product.cost_price||0, stock: 0, min_stock: 2
    }).select('id').single();
    if(error) throw error;
    return created.id;
  }
  async function ensureCustomerRemote(customerId, tenantId){
    if(!customerId || !customerId.startsWith('local_')) return customerId;
    const localCusts = getLocalCustomers(tenantId);
    const cust = localCusts.find(c=>c.id===customerId);
    if(!cust) return null;
    const { data: existing } = await supabase.from('pos_customers').select('id').eq('tenant_id', tenantId).eq('name', cust.name).maybeSingle();
    if(existing) return existing.id;
    const { data: created, error } = await supabase.from('pos_customers').insert({
      tenant_id: tenantId, name: cust.name, phone: cust.phone||'', balance: 0
    }).select('id').single();
    if(error) throw error;
    return created.id;
  }

  async function syncPending(){
    const pendings = getPendingSales();
    if(pendings.length===0){ setPendingCount(0); return; }
    if(syncing) return;
    setSyncing(true);
    let synced = 0;
    const remaining = [];
    for(const sale of pendings){
      try{
        const { items, localId, syncStatus, created_at, ...payload } = sale;
        if(payload.customer_id){ payload.customer_id = await ensureCustomerRemote(payload.customer_id, tenantId); }
        const { data: saleData, error: saleError } = await supabase.from('pos_sales').insert(payload).select().single();
        if(saleError) throw saleError;
        for(const it of items){
          try{
            const remoteProdId = await ensureProductRemote(it, tenantId);
            await supabase.from('pos_sale_items').insert({ sale_id: saleData.id, product_id: remoteProdId, qty: it.qty, sell_price: it.sell_price, cost_price: it.cost_price||0 });
            const { data: prod } = await supabase.from('pos_products').select('stock').eq('id', remoteProdId).single();
            if(prod) await supabase.from('pos_products').update({ stock: (prod.stock||0)-it.qty }).eq('id', remoteProdId);
          }catch(itemErr){ console.log('item sync error', itemErr); }
        }
        if(payload.customer_id && (payload.payment_type==='fiado' || payload.payment_type==='abono')){
          if(payload.payment_type==='fiado'){
            const { data: cust } = await supabase.from('pos_customers').select('balance').eq('id', payload.customer_id).single();
            if(cust) await supabase.from('pos_customers').update({ balance: (cust.balance||0)+payload.total }).eq('id', payload.customer_id);
          } else if(payload.payment_type==='abono'){
            const { data: cust } = await supabase.from('pos_customers').select('balance').eq('id', payload.customer_id).single();
            if(cust) await supabase.from('pos_customers').update({ balance: Math.max(0,(cust.balance||0)-payload.total) }).eq('id', payload.customer_id);
          }
        }
        synced++;
      }catch(e){ remaining.push(sale); }
    }
    localStorage.setItem('pos_pending_sales', JSON.stringify(remaining));
    setPendingCount(remaining.length);
    setSyncing(false);
    if(synced>0){
      if(remaining.length===0){
        localStorage.removeItem('pos_pending_sales');
        setPendingCount(0);
      }
      await loadAll();
    }
  }

  async function loadAll(force=false) {
    setPendingCount(getPendingSales().length);
    const lastDailyClosure = localStorage.getItem(`pos_last_daily_closure_${tenantId}`);
    const lastMonthlyClosure = localStorage.getItem(`pos_last_monthly_closure_${tenantId}`);
    const lastDailyTime = lastDailyClosure ? new Date(lastDailyClosure) : null;
    const lastMonthlyTime = lastMonthlyClosure ? new Date(lastMonthlyClosure) : null;
    const now = Date.now();
    const lastSync = parseInt(localStorage.getItem(`pos_last_sync_${tenantId}`)||'0');
    const shouldFetchCloud = force || (now - lastSync > 10*60*1000) || !localStorage.getItem(`pos_products_${tenantId}`);

    // Siempre muestra local primero (instantáneo, 0 egress)
    setProducts(getLocalProducts(tenantId));
    setCustomers(getLocalCustomers(tenantId));
    const daily = getDailyStats(tenantId);
    if(daily){
      if(!lastDailyTime || new Date(daily.date) > lastDailyTime || new Date(daily.date).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]){
        if(lastDailyTime && lastDailyTime.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]){
          setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
          setSparkData([0,0,0,0,0,0,0]);
        } else {
          setStats({ todaySales: daily.todaySales||0, todayProfit: daily.todayProfit||0, countSales: daily.countSales||0, efectivo: daily.efectivo||0, fiado: daily.fiado||0, abonos: daily.abonos||0 });
          setSparkData([0,0,0,0,0,0, daily.todaySales||0]);
        }
      } else {
        setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
        setSparkData([0,0,0,0,0,0,0]);
      }
    }

    if(!shouldFetchCloud){
      // Usa cache local, no gasta egress
      // Solo actualiza stats de ventas si hay internet
      if(navigator.onLine){
        try{
          const today = new Date().toISOString().split('T')[0];
          let query = supabase.from('pos_sales').select('id,total,payment_type,created_at').eq('tenant_id', tenantId).gte('created_at', today).limit(200);
          if(lastDailyTime) query = query.gte('created_at', lastDailyTime.toISOString());
          const { data: sales } = await query;
          if(sales){
            let t=0,p=0,c=sales.length, ef=0, fi=0, ab=0;
            const pendingsToday = getPendingSales().filter(s=>{ const d=new Date(s.created_at).toISOString().split('T')[0]; const afterDaily = lastDailyTime ? new Date(s.created_at) > lastDailyTime : true; return d===today && afterDaily; });
            const allSales = [...(sales||[]), ...pendingsToday];
            for(const s of allSales){ t+=s.total||0; if(s.payment_type==='efectivo') ef+=s.total||0; if(s.payment_type==='fiado') fi+=s.total||0; if(s.payment_type==='abono') ab+=s.total||0; }
            setStats({ todaySales:t, todayProfit:0, countSales:c+pendingsToday.length, efectivo:ef, fiado:fi, abonos:ab });
          }
        }catch{}
      }
      return;
    }

    if(navigator.onLine){
      try{
        // OPTIMIZADO: solo columnas necesarias = 80% menos egress
        const { data: prods } = await supabase.from('pos_products').select('id,name,stock,sell_price,cost_price,category,barcode,tenant_id').eq('tenant_id', tenantId).order('name').limit(5000);
        const { data: custs } = await supabase.from('pos_customers').select('id,name,phone,balance,tenant_id').eq('tenant_id', tenantId).order('name').limit(2000);
        if(prods){ setProducts(prods); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(prods)); }
        if(custs){ setCustomers(custs); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(custs)); }
        localStorage.setItem(`pos_last_sync_${tenantId}`, now.toString());
      }catch{
        // fallback ya mostrado
      }
    }

    if(navigator.onLine){
      const today = new Date().toISOString().split('T')[0];
      let query = supabase.from('pos_sales').select('id,total,payment_type,created_at').eq('tenant_id', tenantId).gte('created_at', today).limit(200);
      if(lastDailyTime) query = query.gte('created_at', lastDailyTime.toISOString());
      const { data: sales } = await query;
      const pendingsToday = getPendingSales().filter(s=>{
        const d = new Date(s.created_at).toISOString().split('T')[0];
        const afterDaily = lastDailyTime ? new Date(s.created_at) > lastDailyTime : true;
        return d===today && afterDaily;
      });
      if(sales){
        let t=0,p=0,c=sales.length, ef=0, fi=0, ab=0;
        const allSales = [...(sales||[]), ...pendingsToday];
        for(const s of allSales){ t+=s.total||0; if(s.payment_type==='efectivo') ef+=s.total||0; if(s.payment_type==='fiado') fi+=s.total||0; if(s.payment_type==='abono') ab+=s.total||0; }
        setStats({ todaySales:t, todayProfit:0, countSales:c+pendingsToday.length, efectivo:ef, fiado:fi, abonos:ab });
      }
    }
  }

    async function syncPending(){
    const pendings = getPendingSales();
    if(pendings.length===0){ setPendingCount(0); return; }
    if(syncing) return;
    setSyncing(true);
    let synced = 0;
    const remaining = [];
    for(const sale of pendings){
      try{
        const { items, localId, syncStatus, created_at, ...payload } = sale;
        if(payload.customer_id){ payload.customer_id = await ensureCustomerRemote(payload.customer_id, tenantId); }
        const { data: saleData, error: saleError } = await supabase.from('pos_sales').insert(payload).select().single();
        if(saleError) throw saleError;
        for(const it of items){
          try{
            const remoteProdId = await ensureProductRemote(it, tenantId);
            await supabase.from('pos_sale_items').insert({ sale_id: saleData.id, product_id: remoteProdId, qty: it.qty, sell_price: it.sell_price, cost_price: it.cost_price||0 });
            const { data: prod } = await supabase.from('pos_products').select('stock').eq('id', remoteProdId).single();
            if(prod) await supabase.from('pos_products').update({ stock: (prod.stock||0)-it.qty }).eq('id', remoteProdId);
          }catch(itemErr){ console.log('item sync error', itemErr); }
        }
        if(payload.customer_id && (payload.payment_type==='fiado' || payload.payment_type==='abono')){
          if(payload.payment_type==='fiado'){
            const { data: cust } = await supabase.from('pos_customers').select('balance').eq('id', payload.customer_id).single();
            if(cust) await supabase.from('pos_customers').update({ balance: (cust.balance||0)+payload.total }).eq('id', payload.customer_id);
          } else if(payload.payment_type==='abono'){
            const { data: cust } = await supabase.from('pos_customers').select('balance').eq('id', payload.customer_id).single();
            if(cust) await supabase.from('pos_customers').update({ balance: Math.max(0,(cust.balance||0)-payload.total) }).eq('id', payload.customer_id);
          }
        }
        synced++;
      }catch(e){ remaining.push(sale); }
    }
    localStorage.setItem('pos_pending_sales', JSON.stringify(remaining));
    setPendingCount(remaining.length);
    setSyncing(false);
    if(synced>0){
      if(remaining.length===0){
        localStorage.removeItem('pos_pending_sales');
        setPendingCount(0);
      }
      await loadAll();
    }
  }

  async function loadAll() {
    setPendingCount(getPendingSales().length);
    // FIX SEPARADO: cierre diario y mensual separados
    const lastDailyClosure = localStorage.getItem(`pos_last_daily_closure_${tenantId}`);
    const lastMonthlyClosure = localStorage.getItem(`pos_last_monthly_closure_${tenantId}`);
    const lastDailyTime = lastDailyClosure ? new Date(lastDailyClosure) : null;
    const lastMonthlyTime = lastMonthlyClosure ? new Date(lastMonthlyClosure) : null;

    if(navigator.onLine){
      try{
        const { data: prods } = await supabase.from('pos_products').select('*').eq('tenant_id', tenantId).order('name');
        const { data: custs } = await supabase.from('pos_customers').select('*').eq('tenant_id', tenantId).order('name');
        if(prods){ setProducts(prods); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(prods)); }
        if(custs){ setCustomers(custs); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(custs)); }
      }catch{
        setProducts(getLocalProducts(tenantId));
        setCustomers(getLocalCustomers(tenantId));
      }
    } else {
      setProducts(getLocalProducts(tenantId));
      setCustomers(getLocalCustomers(tenantId));
      const daily = getDailyStats(tenantId);
      if(daily){
        // Si hay cierre diario hoy, no mostrar
        if(!lastDailyTime || new Date(daily.date) > lastDailyTime || new Date(daily.date).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]){
          // Si cierre fue hoy, stats en cero
          if(lastDailyTime && lastDailyTime.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]){
            setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
            setSparkData([0,0,0,0,0,0,0]);
          } else {
            setStats({ todaySales: daily.todaySales||0, todayProfit: daily.todayProfit||0, countSales: daily.countSales||0, efectivo: daily.efectivo||0, fiado: daily.fiado||0, abonos: daily.abonos||0 });
            setSparkData([0,0,0,0,0,0, daily.todaySales||0]);
          }
        } else {
          setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
          setSparkData([0,0,0,0,0,0,0]);
        }
      } else {
        if(lastDailyTime && lastDailyTime.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]){
          setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
        }
      }
    }

    if(navigator.onLine){
      const today = new Date().toISOString().split('T')[0];
      // Diario: filtrar por último cierre diario
      let query = supabase.from('pos_sales').select('*').eq('tenant_id', tenantId).gte('created_at', today);
      if(lastDailyTime){
        query = query.gte('created_at', lastDailyTime.toISOString());
      }
      const { data: sales } = await query;
      
      const pendingsToday = getPendingSales().filter(s=>{
        const d = new Date(s.created_at).toISOString().split('T')[0];
        const afterDaily = lastDailyTime ? new Date(s.created_at) > lastDailyTime : true;
        return d===today && afterDaily;
      });

      const onlineSales = sales?.filter(s=>s.payment_type!=='abono').reduce((s,i)=>s+i.total,0)||0;
      const onlineProfit = sales?.reduce((s,i)=>s+i.profit,0)||0;
      const onlineEfectivo = sales?.filter(s=>s.payment_type==='efectivo').reduce((s,i)=>s+i.total,0)||0;
      const onlineFiado = sales?.filter(s=>s.payment_type==='fiado').reduce((s,i)=>s+i.total,0)||0;
      const onlineAbonos = sales?.filter(s=>s.payment_type==='abono').reduce((s,i)=>s+i.total,0)||0;
      const offlineSales = pendingsToday.filter(s=>s.payment_type!=='abono').reduce((s,i)=>s+i.total,0);
      const offlineProfit = pendingsToday.reduce((s,i)=>s+i.profit,0);
      const offlineEfectivo = pendingsToday.filter(s=>s.payment_type==='efectivo').reduce((s,i)=>s+i.total,0);
      const offlineFiado = pendingsToday.filter(s=>s.payment_type==='fiado').reduce((s,i)=>s+i.total,0);
      const offlineAbonos = pendingsToday.filter(s=>s.payment_type==='abono').reduce((s,i)=>s+i.total,0);

      setStats({
        todaySales: onlineSales+offlineSales,
        todayProfit: onlineProfit+offlineProfit,
        countSales: (sales?.length||0)+pendingsToday.length,
        efectivo: onlineEfectivo+offlineEfectivo,
        fiado: onlineFiado+offlineFiado,
        abonos: onlineAbonos+offlineAbonos
      });

      // Mensual: filtrar por último cierre mensual, NO por diario
      const firstDay = new Date(); firstDay.setDate(1); firstDay.setHours(0,0,0,0);
      let monthStart = firstDay;
      if(lastMonthlyTime && lastMonthlyTime > firstDay){
        monthStart = lastMonthlyTime;
      }
      const { data: monthSales } = await supabase.from('pos_sales').select('total, profit, created_at').eq('tenant_id', tenantId).gte('created_at', monthStart.toISOString()).order('created_at');
      
      const dailyMap = {};
      (monthSales||[]).forEach(s=>{
        const d = new Date(s.created_at).toISOString().split('T')[0];
        if(!dailyMap[d]) dailyMap[d]={ date:d, total:0, profit:0, count:0 };
        dailyMap[d].total+=s.total; dailyMap[d].profit+=s.profit; dailyMap[d].count++;
      });
      getPendingSales().forEach(s=>{
        const afterMonthly = lastMonthlyTime ? new Date(s.created_at) > lastMonthlyTime : true;
        if(afterMonthly){
          const d = new Date(s.created_at).toISOString().split('T')[0];
          if(new Date(d) >= monthStart){
            if(!dailyMap[d]) dailyMap[d]={ date:d, total:0, profit:0, count:0 };
            dailyMap[d].total+=s.total; dailyMap[d].profit+=s.profit; dailyMap[d].count++;
          }
        }
      });
      setMonthly(Object.values(dailyMap).reverse());
      const hist = JSON.parse(localStorage.getItem(`pos_closures_history_${tenantId}`)||'[]');
      setClosures(hist);

      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-6);
      const { data: weekSales } = await supabase.from('pos_sales').select('total, created_at').eq('tenant_id', tenantId).gte('created_at', weekAgo.toISOString()).order('created_at');
      const dailyArr = Array(7).fill(0);
      if(weekSales){
        weekSales.forEach(s=>{
          if(lastDailyTime && new Date(s.created_at) <= lastDailyTime) return;
          const dayIdx = Math.floor((new Date(s.created_at)-weekAgo)/(1000*60*60*24));
          if(dayIdx>=0&&dayIdx<7) dailyArr[dayIdx]+=s.total;
        });
      }
      dailyArr[6] += offlineSales;
      setSparkData(dailyArr);
    }
  }

  function handlePinLogin() {
    if(pinInput===ADMIN_PIN){ const a={role:'admin'}; setAuth(a); localStorage.setItem(`pos_auth_${tenantId}`, JSON.stringify(a)); }
    else if(pinInput===EMPLEADO_PIN){ const a={role:'empleado'}; setAuth(a); localStorage.setItem(`pos_auth_${tenantId}`, JSON.stringify(a)); }
    else alert('PIN incorrecto'); setPinInput('');
  }
  function getSoftMessage(c){ return `Hola ${c.name}! 😊 Te saluda ${tenantId}. Tu saldito pendiente es C$ ${c.balance}. Gracias 🙏!`; }
  function sendWhatsAppFiado(c){ const phone=(c.phone||'').replace(/\D/g,''); if(!phone) return alert('Sin teléfono'); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(getSoftMessage(c))}`, '_blank'); }
  function callCustomer(c){ const phone=(c.phone||'').replace(/\D/g,''); if(!phone) return alert('Sin teléfono'); window.location.href=`tel:+${phone}`; }
  function smsCustomer(c){ const phone=(c.phone||'').replace(/\D/g,''); if(!phone) return alert('Sin teléfono'); window.open(`sms:+${phone}?&body=${encodeURIComponent(getSoftMessage(c))}`, '_blank'); }

  async function saveProduct(){
    if(!newProd.name || !newProd.sell_price) return alert('Nombre y venta obligatorios');
    const payload = { tenant_id: tenantId, name: newProd.name.trim(), sell_price: Number(newProd.sell_price), cost_price: Number(newProd.cost_price||0), stock: Number(newProd.stock||0), min_stock: 2 };
    if(editingProd){
      if(navigator.onLine && !editingProd.id.startsWith('local_')) await supabase.from('pos_products').update(payload).eq('id', editingProd.id);
      const updated = products.map(p=> p.id===editingProd.id ? {...p, ...payload} : p);
      setProducts(updated); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(updated));
    } else {
      if(navigator.onLine){
        const { data } = await supabase.from('pos_products').insert(payload).select().single();
        if(data){ const updated=[...products, data]; setProducts(updated); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(updated)); }
      } else {
        const localProd = { ...payload, id: 'local_'+Date.now() };
        const updated = [...products, localProd];
        setProducts(updated); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(updated));
      }
    }
    setNewProd({ name:'', sell_price:'', cost_price:'', stock:'' }); setEditingProd(null); setShowAddProduct(false);
  }
  async function deleteProduct(id){ if(!confirm('¿Borrar producto?')) return; if(navigator.onLine && !id.startsWith('local_')){ await supabase.from('pos_sale_items').delete().eq('product_id', id); await supabase.from('pos_products').delete().eq('id', id); } const filtered=products.filter(p=>p.id!==id); setProducts(filtered); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(filtered)); }
  async function saveCustomer(){
    if(!newCust.name.trim()) return alert('Nombre obligatorio');
    const payload = { tenant_id: tenantId, name: newCust.name.trim(), phone: newCust.phone.trim()||null, balance: 0 };
    if(navigator.onLine){
      let { data, error } = await supabase.from('pos_customers').insert(payload).select().single();
      if(error){ const payload2 = { ...payload, phone: payload.phone||'', type:'general' }; const r2 = await supabase.from('pos_customers').insert(payload2).select().single(); data=r2.data; error=r2.error; }
      if(error) return alert(error.message);
      const updated=[...customers, data]; setCustomers(updated); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(updated));
    } else {
      const localCust = { ...payload, id: 'local_'+Date.now(), phone: payload.phone||'' };
      const updated = [...customers, localCust];
      setCustomers(updated); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(updated));
    }
    setNewCust({ name:'', phone:'' }); setShowAddCustomer(false);
  }
  async function deleteCustomer(id){ const c=customers.find(x=>x.id===id); if(c?.balance>0) return alert('No puedes borrar cliente con deuda'); if(!confirm('¿Borrar?')) return; if(navigator.onLine && !id.startsWith('local_')){ await supabase.from('pos_sales').delete().eq('customer_id', id); await supabase.from('pos_customers').delete().eq('id', id); } const filtered=customers.filter(x=>x.id!==id); setCustomers(filtered); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(filtered)); }

  function startEditProduct(p){ setEditingProd(p); setNewProd({ name:p.name, sell_price:String(p.sell_price), cost_price:String(p.cost_price||''), stock:String(p.stock||0) }); setShowAddProduct(true); }
  
  function addToCart(p){
    if(p.stock<=0) return alert('Sin stock');
    setCart(prev=>{ const ex=prev.find(i=>i.id===p.id); if(ex) return prev.map(i=>i.id===p.id?{...i, qty:i.qty+1}:i); return [...prev, {...p, qty:1}]; });
    setTimeout(()=>{
      if(cartRef.current){
        cartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCartFlash(true);
        setTimeout(()=>setCartFlash(false), 800);
      } else if(window.innerWidth < 1024){
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }
  const total = cart.reduce((s,i)=>s+i.sell_price*i.qty,0);
  const profit = cart.reduce((s,i)=>s+(i.sell_price-(i.cost_price||0))*i.qty,0);

  async function handleSell(type, customerId=null){
    if(cart.length===0) return; if(type==='fiado' && !customerId) return alert('Selecciona cliente');
    const custName = customerId ? customers.find(c=>c.id===customerId)?.name : null;
    const salePayload = { tenant_id: tenantId, total, total_cost: total-profit, profit, payment_type: type, status: type==='fiado'?'fiado':'pagado', customer_id: customerId, created_at: new Date().toISOString() };
    if(isOnline){
      try{
        const { data:saleData, error } = await supabase.from('pos_sales').insert(salePayload).select().single();
        if(error) throw error;
        for(const item of cart){
          const prodId = item.id.startsWith('local_') ? await ensureProductRemote(item, tenantId) : item.id;
          await supabase.from('pos_sale_items').insert({ sale_id:saleData.id, product_id:prodId, qty:item.qty, sell_price:item.sell_price, cost_price:item.cost_price||0 });
          if(!item.id.startsWith('local_')){
            const { data: prod } = await supabase.from('pos_products').select('stock').eq('id', item.id).single();
            if(prod) await supabase.from('pos_products').update({ stock: (prod.stock||0)-item.qty }).eq('id', item.id);
          }
        }
        if(type==='fiado' && customerId && !customerId.startsWith('local_')){
          const { data: cust } = await supabase.from('pos_customers').select('balance').eq('id', customerId).single();
          if(cust) await supabase.from('pos_customers').update({ balance:(cust.balance||0)+total }).eq('id', customerId);
        }
        setLastSale({ id:saleData.id.slice(0,6), items:[...cart], total, profit, type, date:new Date(), customerName: custName });
      }catch(e){
        const saleLocal = { ...salePayload, localId:'local_'+Date.now(), syncStatus:'pending', items:[...cart] };
        const list=getPendingSales(); list.push(saleLocal); localStorage.setItem('pos_pending_sales', JSON.stringify(list));
        setPendingCount(list.length);
        updateDailyStatsOffline(tenantId, salePayload);
        setLastSale({ id:saleLocal.localId.slice(0,6), items:[...cart], total, profit, type: type+' (OFFLINE)', date:new Date(), customerName: custName });
        const updatedProds = products.map(p=>{ const it=cart.find(i=>i.id===p.id); if(it) return {...p, stock: (p.stock||0)-it.qty}; return p; });
        setProducts(updatedProds); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(updatedProds));
      }
    } else {
      const saleLocal = { ...salePayload, localId:'local_'+Date.now(), syncStatus:'pending', items:[...cart] };
      const list=getPendingSales(); list.push(saleLocal); localStorage.setItem('pos_pending_sales', JSON.stringify(list));
      setPendingCount(list.length);
      const daily = updateDailyStatsOffline(tenantId, salePayload);
      setStats({ todaySales: daily.todaySales, todayProfit: daily.todayProfit, countSales: daily.countSales, efectivo: daily.efectivo, fiado: daily.fiado, abonos: daily.abonos });
      setSparkData(prev=>{ const arr=[...prev]; arr[6]=daily.todaySales; return arr; });
      const updatedProds = products.map(p=>{ const it=cart.find(i=>i.id===p.id); if(it) return {...p, stock: (p.stock||0)-it.qty}; return p; });
      setProducts(updatedProds); localStorage.setItem(`pos_products_${tenantId}`, JSON.stringify(updatedProds));
      if(type==='fiado' && customerId){
        const updatedCusts = customers.map(c=> c.id===customerId ? {...c, balance:(c.balance||0)+total} : c);
        setCustomers(updatedCusts); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(updatedCusts));
      }
      setLastSale({ id:saleLocal.localId.slice(0,6), items:[...cart], total, profit, type: type+' (OFFLINE)', date:new Date(), customerName: custName });
    }
    if(customerId){ const cust=customers.find(c=>c.id===customerId); if(cust?.phone) setBuyerPhone(cust.phone); } else setBuyerPhone('');
    setShowTicketModal(true); setCart([]);
    if(isOnline) loadAll();
  }

  async function handleAbono(){
    const cid=abonoData.customerId; const amt=Number(abonoData.amount); if(!cid||!amt) return alert('Falta datos');
    const cust=customers.find(c=>c.id===cid); if(amt>cust.balance) return alert('Abono mayor a deuda');
    const payload = { tenant_id:tenantId, total:amt, total_cost:0, profit:amt, payment_type:'abono', status:'pagado', customer_id:cid, created_at: new Date().toISOString() };
    if(isOnline){
      try{
        const remoteCid = cid.startsWith('local_') ? await ensureCustomerRemote(cid, tenantId) : cid;
        const { data } = await supabase.from('pos_sales').insert({...payload, customer_id: remoteCid}).select().single();
        await supabase.from('pos_customers').update({ balance:cust.balance-amt }).eq('id', remoteCid);
        setLastSale({ id: data.id.slice(0,6), items:[{ name:`Abono de ${cust.name}`, qty:1, sell_price:amt }], total:amt, profit:amt, type:'abono', date:new Date(), customerName: cust.name });
      }catch(e){
        const saleLocal = { ...payload, localId:'local_'+Date.now(), syncStatus:'pending', items:[{ name:`Abono ${cust.name}`, id:'abono', qty:1, sell_price:amt, cost_price:0 }] };
        const list=getPendingSales(); list.push(saleLocal); localStorage.setItem('pos_pending_sales', JSON.stringify(list)); setPendingCount(list.length);
        const daily = updateDailyStatsOffline(tenantId, payload);
        setStats({ todaySales: daily.todaySales, todayProfit: daily.todayProfit, countSales: daily.countSales, efectivo: daily.efectivo, fiado: daily.fiado, abonos: daily.abonos });
        setLastSale({ id: saleLocal.localId.slice(0,6), items:[{ name:`Abono de ${cust.name}`, qty:1, sell_price:amt }], total:amt, profit:amt, type:'abono (OFFLINE)', date:new Date(), customerName: cust.name });
      }
    } else {
      const saleLocal = { ...payload, localId:'local_'+Date.now(), syncStatus:'pending', items:[{ name:`Abono ${cust.name}`, id:'abono', qty:1, sell_price:amt, cost_price:0 }] };
      const list=getPendingSales(); list.push(saleLocal); localStorage.setItem('pos_pending_sales', JSON.stringify(list)); setPendingCount(list.length);
      const daily = updateDailyStatsOffline(tenantId, payload);
      setStats({ todaySales: daily.todaySales, todayProfit: daily.todayProfit, countSales: daily.countSales, efectivo: daily.efectivo, fiado: daily.fiado, abonos: daily.abonos });
      setLastSale({ id: saleLocal.localId.slice(0,6), items:[{ name:`Abono de ${cust.name}`, qty:1, sell_price:amt }], total:amt, profit:amt, type:'abono (OFFLINE)', date:new Date(), customerName: cust.name });
      const updatedCusts = customers.map(c=> c.id===cid ? {...c, balance:c.balance-amt} : c);
      setCustomers(updatedCusts); localStorage.setItem(`pos_customers_${tenantId}`, JSON.stringify(updatedCusts));
    }
    if(cust.phone) setBuyerPhone(cust.phone);
    setShowTicketModal(true); setAbonoData({ customerId:'', amount:'' }); setShowAbonos(false); if(isOnline) loadAll();
  }

  function handleCierreDiario(){
    if(!confirm(`¿Cerrar día ${new Date().toLocaleDateString('es-NI')}?\nTotal: C$ ${stats.todaySales}\nGanancia: C$ ${stats.todayProfit}\n\nAl cerrar, los botones diarios quedarán en C$0 para mañana. El mes sigue sumando.`)) return;
    const cierre = { id: Date.now().toString(), tenant_id: tenantId, type: 'diario', date: new Date().toISOString().split('T')[0], total: stats.todaySales, profit: stats.todayProfit, efectivo: stats.efectivo, fiado: stats.fiado, abonos: stats.abonos, count: stats.countSales, created_at: new Date().toISOString() };
    const hist = JSON.parse(localStorage.getItem(`pos_closures_history_${tenantId}`)||'[]'); hist.unshift(cierre); localStorage.setItem(`pos_closures_history_${tenantId}`, JSON.stringify(hist)); setClosures(hist);
    // FIX: Solo cierre diario, NO toca mensual
    localStorage.setItem(`pos_last_daily_closure_${tenantId}`, new Date().toISOString());
    localStorage.removeItem(`pos_daily_stats_${tenantId}`);
    setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
    setSparkData([0,0,0,0,0,0,0]);
    alert('✅ Cierre diario guardado - Diario en cero, mensual sigue sumando');
  }
  function handleCierreMensual(){
    const totalMes = monthly.reduce((s,d)=>s+d.total,0); const profitMes = monthly.reduce((s,d)=>s+d.profit,0);
    if(!confirm(`¿Cerrar mes ${new Date().toLocaleString('es-NI',{month:'long'})}?\nTotal: C$ ${totalMes}\nGanancia: C$ ${profitMes}\n\nSe reiniciará el mes y también el diario.`)) return;
    const cierre = { id: Date.now().toString(), tenant_id: tenantId, type: 'mensual', date: new Date().toISOString().slice(0,7), total: totalMes, profit: profitMes, count: monthly.reduce((s,d)=>s+d.count,0), created_at: new Date().toISOString() };
    const hist = JSON.parse(localStorage.getItem(`pos_closures_history_${tenantId}`)||'[]'); hist.unshift(cierre); localStorage.setItem(`pos_closures_history_${tenantId}`, JSON.stringify(hist)); setClosures(hist);
    // Mensual sí resetea ambos
    localStorage.setItem(`pos_last_monthly_closure_${tenantId}`, new Date().toISOString());
    localStorage.setItem(`pos_last_daily_closure_${tenantId}`, new Date().toISOString());
    localStorage.removeItem(`pos_daily_stats_${tenantId}`);
    localStorage.removeItem('pos_pending_sales');
    setPendingCount(0);
    setStats({ todaySales: 0, todayProfit: 0, countSales: 0, efectivo:0, fiado:0, abonos:0 });
    setSparkData([0,0,0,0,0,0,0]);
    setMonthly([]);
    alert('✅ Cierre mensual guardado - Todo en cero para nuevo mes');
  }
  function printPaperTicket(sale){
    const win=window.open('','_blank','width=300,height=600');
    const itemsHtml=sale.items.map(i=>`<div style="display:flex;justify-content:space-between"><span>${i.name} x${i.qty}</span><span>C$ ${i.sell_price*i.qty}</span></div>`).join('');
    win.document.write(`<html><head><style>body{width:58mm;font-family:monospace;font-size:11px;padding:5mm}.center{text-align:center}.line{border-top:1px dashed #000;margin:6px 0}</style></head><body><div class="center"><b>${tenantId.toUpperCase()}</b><br/>${sale.date.toLocaleString()}</div><div class="line"></div><div>#${sale.id} - ${sale.type}</div><div class="line"></div>${itemsHtml}<div class="line"></div><div style="display:flex;justify-content:space-between;font-weight:bold"><span>TOTAL</span><span>C$ ${sale.total}</span></div><div class="center"><br/>Gracias!</div><script>window.print();</script></body></html>`);
  }
  function MiniChart({ data, color }) {
    const hasData = data.some(v=>v>0); if(!hasData) return <div className="flex items-center h-full"><div className="w-14 h-[2px] bg-gray-200 rounded-full opacity-60"></div></div>;
    const max=Math.max(...data,1); const min=Math.min(...data); const range=max-min||1; const points=data.map((v,i)=>`${(i/(data.length-1))*56},${28-((v-min)/range)*24}`).join(' ');
    return <svg width="56" height="28" className="overflow-visible"><polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points}/><circle cx="56" cy={28-((data[data.length-1]-min)/range)*24} r="3.5" fill={color}/></svg>;
  }
  function getProductStyle(name){
    const n=name.toLowerCase();
    if(n.includes('sandalias')||n.includes('tenis')||n.includes('zapatos')||n.includes('calzado')) return { bg:'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700', icon:'👟' };
    if(n.includes('tommy')||n.includes('camisa')||n.includes('camiseta')||n.includes('camisola')) return { bg:'bg-gradient-to-br from-red-600 via-rose-500 to-orange-600', icon:'👕' };
    if(n.includes('levis')||n.includes('pantalon')||n.includes('palazo')) return { bg:'bg-gradient-to-br from-teal-600 via-cyan-500 to-emerald-600', icon:'👖' };
    if(n.includes('vestido')||n.includes('falda')) return { bg:'bg-gradient-to-br from-pink-600 via-fuchsia-500 to-rose-600', icon:'👗' };
    if(n.includes('conjunto')||n.includes('cartera')) return { bg:'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600', icon:'👜' };
    if(n.includes('blusa')||n.includes('blumer')||n.includes('brasier')||n.includes('bóxer')||n.includes('licra')) return { bg:'bg-gradient-to-br from-sky-600 via-blue-500 to-violet-600', icon:'🩲' };
    return { bg:'bg-gradient-to-br from-slate-800 via-slate-700 to-zinc-800', icon:'📦' };
  }

  if(!auth){
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f6f7fb]">
        <div className="bg-white p-8 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] w-full max-w-sm border border-gray-100">
          <div className="text-center mb-6"><div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">T</div><h1 className="mt-3 font-black uppercase tracking-wider">{tenantId}</h1><div className={`mt-2 text-[10px] font-bold px-3 py-1 rounded-full inline-block ${isOnline?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{isOnline?'● Online':'● Offline'}</div><p className="text-[11px] text-gray-400 mt-2 font-mono">{now.toLocaleString('es-NI',{weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit'})}</p></div>
          <input type="password" inputMode="numeric" value={pinInput} onChange={e=>setPinInput(e.target.value)} placeholder="PIN" className="w-full border border-gray-200 p-4 rounded-2xl text-center text-2xl font-bold tracking-widest bg-gray-50"/>
          <button onClick={handlePinLogin} className="w-full mt-3 bg-black text-white py-4 rounded-2xl font-black">ENTRAR</button>
          {pendingCount>0 && <p className="text-[11px] text-center mt-3 text-orange-600 font-bold">{pendingCount} ventas offline por sincronizar</p>}
        </div>
      </div>
    );
  }

  const porCobrarTotal = customers.reduce((s,c)=>s+(c.balance||0),0);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-gray-900">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="px-3 py-2.5 flex justify-between items-center max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">T</div><div><p className="font-black text-[11px] uppercase tracking-widest leading-none">{tenantId}</p><div className="flex items-center gap-2"><p className="text-[10px] text-gray-400">POS • {auth.role}</p><span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isOnline?'bg-green-100 text-green-700':'bg-red-100 text-red-700 animate-pulse'}`}>{isOnline?`● Online${pendingCount>0?` (${pendingCount})`:''}`:'● Offline'}</span></div></div></div>
          <div className="flex gap-1.5"><button onClick={goToPos} className={`px-4 py-2 rounded-full text-[11px] font-black ${view==='pos'?'bg-black text-white shadow-lg':'bg-gray-100 text-gray-500'}`}>VENDER</button><button onClick={goToConfig} className={`px-4 py-2 rounded-full text-[11px] font-black ${view==='config'?'bg-black text-white shadow-lg':'bg-gray-100 text-gray-500'}`}>CONFIG</button></div>
        </div>
        {/* FIX: Solo una hora, discreta a la par de la fecha */}
        <div className="px-3 py-1.5 bg-gray-50/70 border-t border-gray-50 flex justify-between items-center max-w-[1400px] mx-auto">
          <p className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
            <span>📅 {now.toLocaleString('es-NI',{weekday:'short', day:'2-digit', month:'short'})}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="font-bold text-gray-700">🕒 {now.toLocaleTimeString('es-NI',{hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
          </p>
          {isOnline ? <p className="text-[10px] text-green-600 font-bold">✓ Sincronizado</p> : <p className="text-[10px] text-orange-600 font-bold">Offline • Guardando local</p>}
        </div>
        {pendingCount>0 && isOnline && <div className="bg-amber-400 text-black text-center text-[11px] font-black py-1.5 flex justify-center items-center gap-2"><span>{pendingCount} ventas offline por sincronizar</span><button onClick={syncPending} disabled={syncing} className="bg-black text-white px-3 py-1 rounded-full text-[10px] disabled:opacity-50">{syncing?'Sincronizando...':'Sincronizar ahora'}</button></div>}
        {!isOnline && <div className="bg-red-500 text-white text-center text-[11px] font-black py-1.5">🔴 Sin internet - Vendiendo en modo offline</div>}
      </header>

      {view==='pos' ? (
        <div className="p-3 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-white rounded-[20px] p-3.5 border border-gray-100 shadow-sm flex justify-between items-center"><div><p className="text-[10px] font-black text-gray-400 uppercase">Hoy</p><p className="font-black text-[16px] mt-1">C$ {stats.todaySales}</p><p className="text-[10px] font-bold mt-1 text-gray-500">{stats.countSales} ventas</p></div><div className="bg-violet-50 rounded-xl p-2 border border-violet-100"><MiniChart data={sparkData} color="#6d28d9"/></div></div>
            <div className="bg-white rounded-[20px] p-3.5 border border-emerald-100 shadow-sm flex justify-between items-center"><div><p className="text-[10px] font-black text-emerald-600/70 uppercase">Ganancia</p><p className="font-black text-[16px] mt-1 text-emerald-700">C$ {stats.todayProfit}</p><p className="text-[10px] font-bold mt-1 text-emerald-600">Ef: C$ {stats.efectivo}</p></div><div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100"><MiniChart data={sparkData.map(v=>v*0.35)} color="#059669"/></div></div>
            <div className={`rounded-[20px] p-3.5 border flex justify-between items-center ${porCobrarTotal>0?'bg-gradient-to-br from-amber-400 to-orange-400 border-amber-300 shadow-lg':'bg-white border-gray-100 shadow-sm'}`}><div><p className={`text-[10px] font-black uppercase ${porCobrarTotal>0?'text-black/60':'text-gray-400'}`}>Por Cobrar</p><p className="font-black text-[16px] mt-1">C$ {porCobrarTotal}</p></div><div className={`rounded-xl p-2 ${porCobrarTotal>0?'bg-black/10':'bg-amber-50 border border-amber-100'}`}><MiniChart data={porCobrarTotal>0? sparkData.map(()=>porCobrarTotal) : []} color={porCobrarTotal>0?'#000':'#d97706'}/></div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 shadow-sm p-3.5">
              <div className="flex gap-2 mb-3"><div className="flex-1 relative"><input placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"/><span className="absolute right-4 top-3 text-gray-400">⌕</span></div><button onClick={()=>{setEditingProd(null); setNewProd({ name:'', sell_price:'', cost_price:'', stock:'' }); setShowAddProduct(true);}} className="bg-black text-white px-5 rounded-full text-xs font-black">+ PROD</button></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-auto pr-1">
                {products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(p=>{
                  const style=getProductStyle(p.name);
                  return (
                    <div key={p.id} onClick={()=>addToCart(p)} className={`${style.bg} shadow-[0_8px_20px_rgba(0,0,0,0.15)] rounded-[18px] p-3 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all text-white relative overflow-hidden group ${p.id.startsWith('local_')?'ring-2 ring-amber-400':''}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-60"></div>
                      <div className="relative"><div className="flex justify-between items-start mb-2"><span className="bg-white/25 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">{style.icon}</span><span className={`text-[9px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border ${p.stock<=5?'bg-red-500 border-red-400':'bg-white/25 border-white/20'}`}>{p.stock} stock</span></div><p className="font-black text-[12.5px] leading-tight line-clamp-2 drop-shadow">{p.name} {p.id.startsWith('local_') && '(offline)'}</p><p className="font-black text-[16px] mt-1">C$ {p.sell_price}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div ref={cartRef} className={`bg-white rounded-[24px] border shadow-sm p-4 transition-all duration-300 ${cartFlash ? 'border-violet-500 shadow-[0_0_0_4px_rgba(124,58,237,0.15)] scale-[1.01]' : 'border-gray-100 shadow-sm'}`}>
              <div className="flex justify-between items-center mb-3"><h2 className="font-black text-sm flex items-center gap-2">Carrito {cart.length>0 && <span className="bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{cart.length}</span>}</h2><span className="bg-black text-white text-[11px] font-black px-3 py-1 rounded-full">C$ {total}</span></div>
              <div className="max-h-[18vh] overflow-auto divide-y divide-gray-50">
                {cart.map(i=><div key={i.id} className="flex justify-between items-center py-2 text-[12px]"><span className="font-bold">{i.name} x{i.qty}</span><div className="flex items-center gap-2"><span className="font-black">C$ {i.sell_price*i.qty}</span><button onClick={()=>setCart(cart.filter(c=>c.id!==i.id))} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">✕</button></div></div>)}
                {cart.length===0 && <p className="text-center text-gray-400 text-xs py-6">Toca un producto para agregarlo 👆</p>}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={()=>handleSell('efectivo')} className="bg-black text-white py-3.5 rounded-full font-black text-[11px] shadow-lg">EFECTIVO</button>
                <button onClick={()=>setShowAbonos(true)} className="bg-gradient-to-br from-amber-400 to-orange-500 text-black py-3.5 rounded-full font-black text-[11px] shadow">FIADO</button>
                <button onClick={()=>{ if(cart.length>0){ setLastSale({ id:'PREV', items:[...cart], total, profit, type:'prev', date:new Date() }); setShowTicketModal(true);} }} className="bg-gray-100 py-3.5 rounded-full font-black text-[11px]">TICKET</button>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h3 className="font-black text-[11px] tracking-widest uppercase text-gray-400 mb-2">Deudas</h3>
                <div className="max-h-[32vh] overflow-auto space-y-2">
                  {customers.filter(c=>c.balance>0).map(c=>(
                    <div key={c.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                      <div className="flex justify-between items-start"><div><p className="font-black text-xs">{c.name} {c.id.startsWith('local_') && '(offline)'}</p><p className="text-[11px] font-black text-red-600">Debe C$ {c.balance}</p></div><button onClick={()=>{setAbonoData({customerId:c.id, amount:''}); setShowAbonos(true);}} className="bg-black text-white px-3 py-1.5 rounded-full text-[10px] font-black">ABONAR</button></div>
                      <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                        <button onClick={()=>sendWhatsAppFiado(c)} className="bg-[#25D366] text-white py-2 rounded-full text-[10px] font-black">WA</button>
                        <button onClick={()=>callCustomer(c)} className="bg-blue-500 text-white py-2 rounded-full text-[10px] font-black">LLAMAR</button>
                        <button onClick={()=>smsCustomer(c)} className="bg-zinc-800 text-white py-2 rounded-full text-[10px] font-black">SMS</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 max-w-[800px] mx-auto">
          <div className="flex items-center gap-3 mb-4"><button onClick={goToPos} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">←</button><h2 className="font-black tracking-widest uppercase text-sm">Configuración</h2><div className={`ml-auto text-[10px] font-black px-3 py-1 rounded-full ${isOnline?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{isOnline?'● Online':'● Offline'} {pendingCount>0 && `(${pendingCount})`}</div></div>
          <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm w-fit">
            <button onClick={()=>setConfigTab('clientes')} className={`px-4 py-2 rounded-full text-[11px] font-black ${configTab==='clientes'?'bg-black text-white shadow':'bg-transparent text-gray-500'}`}>Clientes</button>
            <button onClick={()=>setConfigTab('productos')} className={`px-4 py-2 rounded-full text-[11px] font-black ${configTab==='productos'?'bg-black text-white shadow':'bg-transparent text-gray-500'}`}>Productos</button>
            <button onClick={()=>setConfigTab('cierres')} className={`px-4 py-2 rounded-full text-[11px] font-black ${configTab==='cierres'?'bg-black text-white shadow':'bg-transparent text-gray-500'}`}>📊 Cierres</button>
          </div>

          {configTab==='clientes' && (<div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4"><input placeholder="Buscar cliente..." value={searchConfig} onChange={e=>setSearchConfig(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 px-4 text-sm mb-3"/><div className="space-y-2 max-h-[60vh] overflow-auto">{customers.filter(c=>c.name.toLowerCase().includes(searchConfig.toLowerCase())).map(c=>(<div key={c.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3"><div className="flex justify-between"><div><p className="font-black text-xs">{c.name}</p><p className={`text-[11px] font-bold ${c.balance>0?'text-red-600':'text-gray-500'}`}>{c.balance>0?`Debe C$ ${c.balance}`:'Al día ✅'} • {c.phone||'Sin tel'}</p></div><button onClick={()=>deleteCustomer(c.id)} className="bg-white border px-3 py-1 rounded-full text-[10px] font-black">Borrar</button></div></div>))}</div><button onClick={()=>setShowAddCustomer(true)} className="mt-3 w-full bg-black text-white py-3 rounded-full text-sm font-black">+ Agregar Cliente</button></div>)}

          {configTab==='productos' && (<div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4"><h3 className="font-black text-xs uppercase tracking-widest mb-3">Productos ({products.length})</h3><input placeholder="Buscar producto..." value={searchConfig} onChange={e=>setSearchConfig(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 px-4 text-sm mb-3"/><div className="max-h-[60vh] overflow-auto divide-y">{products.filter(p=>p.name.toLowerCase().includes(searchConfig.toLowerCase())).map(p=>{ const style=getProductStyle(p.name); return (<div key={p.id} className="flex justify-between items-center py-2.5"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center text-white text-[12px]`}>{style.icon}</div><div><p className="font-bold text-xs">{p.name} {p.id.startsWith('local_') && '(offline)'}</p><p className="text-[10px] text-gray-500">C$ {p.sell_price} • Stock {p.stock}</p></div></div><div className="flex gap-1"><button onClick={()=>startEditProduct(p)} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black">Editar</button><button onClick={()=>deleteProduct(p.id)} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">Borrar</button></div></div>); })}</div></div>)}

          {configTab==='cierres' && (
            <div className="space-y-3">
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-center mb-3"><h3 className="font-black text-xs uppercase tracking-widest">Cierre Diario - Hoy</h3><button onClick={handleCierreDiario} className="bg-black text-white px-4 py-2 rounded-full text-[11px] font-black">🔒 Cerrar Día</button></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><div className="bg-gray-50 p-3 rounded-xl"><p className="text-[10px] text-gray-500 uppercase font-black">Total Ventas</p><p className="font-black text-sm">C$ {stats.todaySales}</p></div><div className="bg-green-50 p-3 rounded-xl"><p className="text-[10px] text-green-700 uppercase font-black">Ganancia</p><p className="font-black text-sm text-green-700">C$ {stats.todayProfit}</p></div><div className="bg-blue-50 p-3 rounded-xl"><p className="text-[10px] text-blue-700 uppercase font-black">Efectivo</p><p className="font-black text-sm text-blue-700">C$ {stats.efectivo}</p></div><div className="bg-orange-50 p-3 rounded-xl"><p className="text-[10px] text-orange-700 uppercase font-black">Fiado + Abonos</p><p className="font-black text-sm text-orange-700">C$ {stats.fiado+stats.abonos}</p></div></div>
                <p className="text-[10px] text-gray-400 mt-2">Al cerrar, diario queda en 0. El mensual sigue sumando hasta que cierres el mes.</p>
              </div>
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4"><div className="flex justify-between items-center mb-3"><h3 className="font-black text-xs uppercase tracking-widest">Cierre Mensual - {now.toLocaleString('es-NI',{month:'long'})}</h3><button onClick={handleCierreMensual} className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-full text-[11px] font-black shadow">🔒 Cerrar Mes</button></div><div className="grid grid-cols-2 gap-2 text-xs mb-3"><div className="bg-violet-50 p-3 rounded-xl border border-violet-100"><p className="text-[10px] text-violet-700 uppercase font-black">Total Mes</p><p className="font-black text-lg text-violet-700">C$ {monthly.reduce((s,d)=>s+d.total,0)}</p></div><div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100"><p className="text-[10px] text-emerald-700 uppercase font-black">Ganancia Mes</p><p className="font-black text-lg text-emerald-700">C$ {monthly.reduce((s,d)=>s+d.profit,0)}</p></div></div><div className="max-h-[30vh] overflow-auto divide-y divide-gray-50">{monthly.map(d=>(<div key={d.date} className="flex justify-between py-2 text-xs"><div><p className="font-bold">{new Date(d.date).toLocaleDateString('es-NI',{weekday:'short', day:'2-digit', month:'short'})}</p><p className="text-[10px] text-gray-500">{d.count} ventas</p></div><div className="text-right"><p className="font-black">C$ {d.total}</p><p className="text-[10px] text-green-600">Gan C$ {d.profit}</p></div></div>))}</div></div>
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4"><h3 className="font-black text-xs uppercase tracking-widest mb-3">Historial Cierres ({closures.length})</h3><div className="max-h-[30vh] overflow-auto space-y-2">{closures.map(c=>(<div key={c.id} className={`p-3 rounded-xl border ${c.type==='mensual'?'bg-violet-50 border-violet-100':'bg-gray-50 border-gray-100'}`}><div className="flex justify-between items-start"><div><p className="font-black text-xs flex items-center gap-2"><span className={`text-[9px] px-2 py-0.5 rounded-full ${c.type==='mensual'?'bg-violet-600 text-white':'bg-black text-white'}`}>{c.type.toUpperCase()}</span> {c.date}</p><p className="text-[11px] mt-1">Total C$ {c.total} • Gan C$ {c.profit} • {c.count} ventas</p></div><p className="text-[9px] text-gray-400">{new Date(c.created_at).toLocaleString('es-NI')}</p></div></div>))}</div></div>
            </div>
          )}
        </div>
      )}

      {showAddProduct && (<div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50"><div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"><h3 className="font-black mb-4">{editingProd?'Editar':'Nuevo'} Producto</h3><input placeholder="Nombre" value={newProd.name} onChange={e=>setNewProd({...newProd, name:e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl mb-3 text-sm"/><div className="grid grid-cols-3 gap-2"><input placeholder="Venta" type="number" value={newProd.sell_price} onChange={e=>setNewProd({...newProd, sell_price:e.target.value})} className="bg-gray-50 border p-3 rounded-2xl text-sm"/><input placeholder="Costo" type="number" value={newProd.cost_price} onChange={e=>setNewProd({...newProd, cost_price:e.target.value})} className="bg-gray-50 border p-3 rounded-2xl text-sm"/><input placeholder="Stock" type="number" value={newProd.stock} onChange={e=>setNewProd({...newProd, stock:e.target.value})} className="bg-gray-50 border p-3 rounded-2xl text-sm"/></div><div className="flex gap-2 mt-4"><button onClick={()=>{setShowAddProduct(false); setEditingProd(null);}} className="flex-1 bg-gray-100 py-3 rounded-full font-black">Cancelar</button><button onClick={saveProduct} className="flex-1 bg-black text-white py-3 rounded-full font-black">Guardar</button></div></div></div>)}
      {showAddCustomer && (<div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50"><div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"><h3 className="font-black mb-3">Nuevo Cliente</h3><input placeholder="Nombre" value={newCust.name} onChange={e=>setNewCust({...newCust, name:e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl mb-3 text-sm"/><input placeholder="WhatsApp 505..." value={newCust.phone} onChange={e=>setNewCust({...newCust, phone:e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl mb-3 text-sm"/><div className="flex gap-2 mt-3"><button onClick={()=>setShowAddCustomer(false)} className="flex-1 bg-gray-100 py-3 rounded-full font-black">Cancelar</button><button onClick={saveCustomer} className="flex-1 bg-black text-white py-3 rounded-full font-black">Guardar</button></div></div></div>)}
      {showAbonos && (<div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50"><div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"><h3 className="font-black mb-4">Fiado / Abono</h3><select value={abonoData.customerId} onChange={e=>setAbonoData({...abonoData, customerId:e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl mb-3 text-sm"><option value="">Selecciona cliente</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} {c.balance>0?`(Debe C$ ${c.balance})`:''}</option>)}</select>{cart.length>0 && <button onClick={()=>{handleSell('fiado', abonoData.customerId); setShowAbonos(false);}} className="w-full bg-gradient-to-br from-amber-400 to-orange-500 text-black py-3 rounded-full font-black text-sm mb-3 shadow">Vender Fiado C$ {total}</button>}<div className="border-t border-gray-100 pt-3"><p className="text-xs font-black uppercase tracking-widest mb-2">Abono</p><input placeholder="Monto" type="number" value={abonoData.amount} onChange={e=>setAbonoData({...abonoData, amount:e.target.value})} className="w-full bg-gray-50 border p-3 rounded-2xl mb-3 text-sm"/><button onClick={handleAbono} className="w-full bg-black text-white py-3 rounded-full font-black text-sm">Abonar</button></div><button onClick={()=>setShowAbonos(false)} className="w-full bg-gray-100 py-3 rounded-full mt-2 text-sm font-black">Cerrar</button></div></div>)}

      {showTicketModal && lastSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-[60]">
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] w-full max-w-sm shadow-[0_-10px_60px_rgba(0,0,0,0.2)] overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4"><div><p className="font-black text-[11px] tracking-widest text-gray-400 uppercase">Ticket Electrónico</p><p className="font-black text-lg leading-none mt-1">#{lastSale.id} • {lastSale.type.toUpperCase()} {lastSale.type.includes('OFFLINE') && <span className="bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded-full ml-1">OFFLINE</span>}</p></div><button onClick={()=>setShowTicketModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">✕</button></div>
              <div className="bg-[#f6f7fb] rounded-2xl p-4 border border-gray-100 font-mono text-[12px]">
                <div className="text-center font-black uppercase tracking-wider mb-2">{tenantId}</div>
                <div className="text-center text-[10px] text-gray-500 mb-3">{lastSale.date.toLocaleString('es-NI')}</div>
                <div className="border-t border-dashed border-gray-300 my-2"></div>
                {lastSale.items.map((i,idx)=><div key={idx} className="flex justify-between py-1"><span>{i.name} x{i.qty}</span><span className="font-black">C$ {i.sell_price*i.qty}</span></div>)}
                <div className="border-t border-dashed border-gray-300 my-2"></div>
                <div className="flex justify-between font-black text-[14px]"><span>TOTAL</span><span>C$ {lastSale.total}</span></div>
                {lastSale.customerName && <div className="mt-2 text-[11px]">Cliente: {lastSale.customerName}</div>}
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-br from-[#25D366]/10 to-emerald-50 border border-[#25D366]/20 rounded-2xl p-4">
                <p className="font-black text-[12px] flex items-center gap-2">💬 Enviar por WhatsApp <span className="bg-[#25D366] text-white text-[9px] px-2 py-0.5 rounded-full">SIN PAPEL</span></p>
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 relative"><span className="absolute left-3 top-3.5 text-gray-400 text-xs">📱</span><input value={buyerPhone} onChange={e=>setBuyerPhone(e.target.value)} placeholder="505 8XXX XXXX" type="tel" className="w-full bg-white border border-gray-200 rounded-full py-3 pl-9 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#25D366]"/></div>
                  <button onClick={()=>{
                    let phone = buyerPhone.replace(/\D/g,''); if(!phone) return alert('Ingresa número'); if(phone.length===8) phone='505'+phone;
                    const itemsTxt = lastSale.items.map(i=>`• ${i.name} x${i.qty} = C$ ${i.sell_price*i.qty}`).join('\n');
                    const text = `*${tenantId.toUpperCase()} - Ticket*\n📅 ${lastSale.date.toLocaleString('es-NI')}\n🧾 #${lastSale.id}\n${lastSale.customerName?`👤 ${lastSale.customerName}\n`:''}\n${itemsTxt}\n\n*TOTAL: C$ ${lastSale.total}*\n${lastSale.type.toUpperCase()}\n\n¡Gracias! 🙏`;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                  }} className="bg-[#25D366] text-white px-5 rounded-full font-black text-[12px] shadow-[0_6px_16px_rgba(37,211,102,0.35)]">Enviar ↗</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>printPaperTicket(lastSale)} className="bg-gray-100 py-3.5 rounded-full font-black text-[12px]">🖨️ Imprimir</button><button onClick={()=>setShowTicketModal(false)} className="bg-black text-white py-3.5 rounded-full font-black text-[12px]">Listo ✓</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
