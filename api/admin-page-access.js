// Admin-only page access helper endpoint.
// The site middleware is the enforcement point; this endpoint lets the frontend verify the current admin cookie.
export default function handler(req,res){
  const cookie=req.headers.cookie||'';
  const ok=/\bflare_admin=/.test(cookie);
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({admin:ok});
}
