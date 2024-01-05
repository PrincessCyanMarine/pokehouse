export async function POST(request: Request) {
  const body = await request.json();
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}
