// Endpoint database untuk Desa Bugangan (Vercel Serverless + Upstash Redis via REST, tanpa dependensi).
// GET  /api/content  -> mengambil data (publik)
// PUT  /api/content  -> menyimpan data (wajib header x-admin-key = ADMIN_KEY)
const URL_=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
const TOKEN=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY='bugangan-content';
const redis=async cmd=>{const r=await fetch(URL_,{method:'POST',headers:{Authorization:'Bearer '+TOKEN},body:JSON.stringify(cmd)});if(!r.ok)throw new Error('redis '+r.status);return (await r.json()).result};
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!URL_||!TOKEN)return res.status(500).json({error:'Database belum terhubung'});
  try{
    if(req.method==='GET'){const v=await redis(['GET',KEY]);return res.status(200).json(v?JSON.parse(v):null)}
    if(req.method==='PUT'){
      if(req.headers['x-admin-key']!==(process.env.ADMIN_KEY||'55555'))return res.status(401).json({error:'Tidak berwenang'});
      const body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
      if(!body||body.length>900000)return res.status(400).json({error:'Data tidak valid'});
      await redis(['SET',KEY,body]);return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'Metode tidak diizinkan'});
  }catch(e){return res.status(500).json({error:'Kesalahan server'})}
};
