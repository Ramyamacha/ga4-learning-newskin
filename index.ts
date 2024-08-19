import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { Eta } from "https://deno.land/x/eta@v3.0.3/src/index.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const viewpath = path.join(Deno.cwd(), "public");
const eta = new Eta({ views: viewpath, cache: true });

const flags = parseArgs(Deno.args, {
  string: ["port"], 
  default: { port: "3000" },
});

async function handler(request: Request) {
  const url = new URL(request.url);
  let filepath = decodeURIComponent(url.pathname);
  
  if (filepath === "/") {
    filepath = "/index.eta";
  } else if (!path.extname(filepath)) {
    filepath = `${filepath}.eta`;
  }

  let response;
  try {
    if (filepath.endsWith(".eta")) {
      const rendered = await eta.render(filepath, {});
      response = new Response(rendered, {
        headers: { "content-type": "text/html" },
      });
    } else {
      const fullPath = path.join(__dirname, "public", filepath);
      const file = await Deno.open(fullPath, { read: true });
      const readableStream = file.readable;
      
      const contentType = getContentType(filepath);
      response = new Response(readableStream, {
        headers: { "content-type": contentType },
      });
    }
  } catch (e) {
    console.error(e);
    response = new Response("404 Not Found", { status: 404 });
  }

  return response;
}

function getContentType(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "application/javascript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

Deno.serve({ port: parseInt(flags.port) }, handler);
