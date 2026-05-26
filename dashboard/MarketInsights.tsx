
'use client';
import {useState} from 'react';

export default function MarketInsights(){
 const [q,setQ]=useState('');
 const [rows,setRows]=useState<any[]>([]);
 const [loading,setLoading]=useState(false);

 async function scan(){
   setLoading(true);
   const r=await fetch('/api/market/scan',{
     method:'POST',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({keyword:q})
   });
   const d=await r.json();
   setRows(d.data||[]);
   setLoading(false);
 }

 return <div style={{padding:20}}>
 <input value={q} onChange={e=>setQ(e.target.value)} placeholder="contoh: sepatu"/>
 <button onClick={scan}>Scan Market</button>
 <div>{loading?'Scanning...':`${rows.length} hasil`}</div>
 {rows.map((r,i)=><div key={i}>{r.product_name}</div>)}
 </div>
}
