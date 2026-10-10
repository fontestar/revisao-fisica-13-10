import { Pool } from "pg";

// Verificação de saúde usada pela hospedagem. O site em si não usa
// banco de dados — o progresso do estudante fica no próprio navegador.
export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    await pool.query("select 1");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
