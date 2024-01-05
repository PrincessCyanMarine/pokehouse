import axios from "axios";

export async function POST(request: Request) {
  let path = request.url.replace(/^.+?\/reroute/, "");
  if (!path) {
    return new Response("No path provided", { status: 400 });
  }
  let url = "http://localhost:8080" + path;
  // console.log("reroute", url);
  try {
    let response = await axios.post(url, await request.json());
    let text = response.data;
    return Response.json(text);
  } catch (err) {
    return new Response(err as any, { status: 500 });
  }
  // console.log(text);
}

export const revalidate = 0;
export const fetchCache = "force-no-store";
