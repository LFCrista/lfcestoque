import { NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabase-server.js' // 4 níveis e .js

// GET de verificação rápida
export async function GET() {
  return NextResponse.json({ ok: true, msg: 'inventory/add OK (GET)' })
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const { sku, amount, reason } = body || {}

    // validação simples
    if (!sku || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: 'sku e amount (>0) são obrigatórios' }, { status: 400 })
    }

    const supabase = createServerClient()
    const FN = 'ajustar_estoque_v2' // <- garantindo que chama a v2

    const { data, error } = await supabase.rpc(FN, {
      p_sku: sku,
      p_delta: amount,
      p_reason: reason ?? 'Entrada'
    })

    if (error) {
      return NextResponse.json({ error: error.message, fn: FN }, { status: 400 })
    }

    return NextResponse.json({ ok: true, result: data?.[0] ?? null, fn: FN })
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
