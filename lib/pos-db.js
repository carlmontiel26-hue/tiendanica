// lib/pos-db.js - Offline-first con Dexie
// npm install dexie
import Dexie from 'dexie';

export const db = new Dexie('TiendaNicaPOS');
db.version(1).stores({
  products: 'id, tenant_id, name, sell_price, stock',
  customers: 'id, tenant_id, name, phone, balance',
  sales: 'id, tenant_id, created_at, status, syncStatus',
  sale_items: 'id, sale_id, product_id',
  closures: 'id, tenant_id, type, date, created_at'
});

// Guarda todo local
export async function saveLocalAll(products, customers) {
  if(!products) return;
  await db.products.clear();
  await db.products.bulkPut(products.map(p=>({...p, id: p.id})));
  if(customers){
    await db.customers.clear();
    await db.customers.bulkPut(customers);
  }
  localStorage.setItem('pos_last_sync', new Date().toISOString());
}

export async function getLocalProducts(tenantId){
  return await db.products.where('tenant_id').equals(tenantId).toArray();
}
export async function getLocalCustomers(tenantId){
  return await db.customers.where('tenant_id').equals(tenantId).toArray();
}

export async function savePendingSale(sale, items){
  const localId = 'local_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  const saleLocal = { ...sale, id: localId, syncStatus: 'pending', created_at: new Date().toISOString(), tenant_id: sale.tenant_id };
  await db.sales.put(saleLocal);
  for(const it of items){
    await db.sale_items.put({ id: localId+'_'+it.id, sale_id: localId, product_id: it.id, qty: it.qty, sell_price: it.sell_price, cost_price: it.cost_price||0 });
  }
  // actualizar stock local
  for(const it of items){
    const prod = await db.products.get(it.id);
    if(prod) await db.products.update(it.id, { stock: (prod.stock||0)-it.qty });
  }
  if(sale.customer_id){
    const cust = await db.customers.get(sale.customer_id);
    if(cust && sale.payment_type==='fiado'){
      await db.customers.update(sale.customer_id, { balance: (cust.balance||0)+sale.total });
    }
  }
  return localId;
}

export async function syncPendingSales(supabase){
  const pendings = await db.sales.where('syncStatus').equals('pending').toArray();
  let synced = 0;
  for(const sale of pendings){
    try {
      const items = await db.sale_items.where('sale_id').equals(sale.id).toArray();
      const { id, syncStatus, ...payload } = sale;
      payload.created_at = sale.created_at;
      const { data, error } = await supabase.from('pos_sales').insert(payload).select().single();
      if(error) throw error;
      for(const it of items){
        await supabase.from('pos_sale_items').insert({ sale_id: data.id, product_id: it.product_id, qty: it.qty, sell_price: it.sell_price, cost_price: it.cost_price });
      }
      await db.sales.update(sale.id, { syncStatus: 'synced', remote_id: data.id });
      synced++;
    } catch(e){ console.log('sync fail', e); }
  }
  return synced;
}
