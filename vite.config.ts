import vinext from 'vinext';
import {defineConfig} from 'vite';

export default defineConfig(async()=>{
  process.env.CLOUDFLARE_CF_FETCH_ENABLED??='false';
  process.env.WRANGLER_SEND_METRICS??='false';
  process.env.WRANGLER_LOG_PATH??='.wrangler/logs';
  const {cloudflare}=await import('@cloudflare/vite-plugin');
  return {
    server:{host:'127.0.0.1',port:5173,strictPort:true},
    plugins:[vinext(),cloudflare({configPath:'wrangler.jsonc',viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false})],
  };
});
