// node --env-file=.env check-amr.mjs you@example.com 'your password'
const [email, password] = process.argv.slice(2);
const url = process.env.PUBLIC_SUPABASE_URL;
const headers = {
	apikey: process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	'content-type': 'application/json'
};

const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
	method: 'POST',
	headers,
	body: JSON.stringify({ email, password })
});
const { access_token } = await signIn.json();
if (!access_token) throw new Error(`Sign-in failed (${signIn.status})`);
headers.authorization = `Bearer ${access_token}`;

const claims = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
console.log('amr in the token:', claims.amr);

for (const fn of ['signed_in_with_password', 'password_session_started_at', 'current_member_id']) {
	const res = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: '{}' });
	console.log(`${fn}:`, await res.json());
}

await fetch(`${url}/auth/v1/logout?scope=local`, { method: 'POST', headers });
