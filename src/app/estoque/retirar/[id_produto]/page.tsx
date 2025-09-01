"use client";

import React, { useEffect, useState } from "react";
import Retirar from "../../../../components/modals/Retirar";
import Adicionar from "../../../../components/modals/Adicionar";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import {
  ToastNotifications,
  successToast,
  errorToast,
} from "../../../../components/ToastNotifications";

/** 🔑 CONFIGURAÇÃO DE API (USAR SEMPRE A ANON KEY NO FRONT) */
const API_BASE = "https://eyezlckotjducyuknbel.supabase.co/rest/v1";
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// debug
console.log("DETALHE | API_KEY presente?", !!API_KEY);

// helper → coloca apikey na URL também
const withKey = (path: string) =>
  `${API_BASE}${path}${path.includes("?") ? "&" : "?"}apikey=${API_KEY}`;

if (!API_KEY) {
  console.error("Faltando NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local");
}

const RetirarEstoque = () => {
  const [estoques, setEstoques] = useState<any[]>([]);
  const [prateleiras, setPrateleiras] = useState<any[]>([]);
  const [produto, setProduto] = useState<any | null>(null);

  // estados de modal: RETIRAR
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [estoqueSelecionado, setEstoqueSelecionado] = useState<any | null>(
    null
  );

  // estados de modal: ADICIONAR
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [estoqueParaAdicionar, setEstoqueParaAdicionar] = useState<any | null>(
    null
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { id_produto } = useParams();
  const router = useRouter();

  useEffect(() => setIsClient(true), []);
  useEffect(() => setUserEmail(localStorage.getItem("user_email")), []);

  /** ⬇️ Carrega estoques + prateleiras + produto */
  useEffect(() => {
    const fetchData = async () => {
      if (!id_produto) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("supabase_jwt");

        const [estoqueResponse, prateleiraResponse, produtoResponse] =
          await Promise.all([
            fetch(withKey(`/estoques?id_produto=eq.${id_produto}`), {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: API_KEY,
              },
            }),
            fetch(withKey(`/prateleiras`), {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: API_KEY,
              },
            }),
            fetch(
              withKey(
                `/produtos?select=id,nome,SKU,codBarras,quantidadeTotal&id=eq.${id_produto}`
              ),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  apikey: API_KEY,
                },
              }
            ),
          ]);

        if (!estoqueResponse.ok) throw new Error("Erro ao buscar os estoques");
        if (!prateleiraResponse.ok)
          throw new Error("Erro ao buscar as prateleiras");
        if (!produtoResponse.ok) throw new Error("Erro ao buscar o produto");

        setEstoques(await estoqueResponse.json());
        setPrateleiras(await prateleiraResponse.json());
        const produtoData = await produtoResponse.json();
        setProduto(produtoData[0] ?? null);
      } catch (e: any) {
        setError(e.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_produto]);

  const getPrateleiraNameById = (id: string) => {
    const p = prateleiras.find((x) => x.id === id);
    return p ? p.nome : "Desconhecida";
  };

  /** ➕ MODAL: abrir */
  const abrirAdicionar = (estoque: any) => {
    setEstoqueParaAdicionar(estoque);
    setIsAddModalOpen(true);
  };

  /** ➕ MODAL: submit (adicionar unidades) */
  const handleAdicionarSubmit = async (quantidade: number) => {
    const est = estoqueParaAdicionar;
    if (!est) return;

    const token = localStorage.getItem("supabase_jwt");
    if (!token) {
      setError("Token JWT não encontrado.");
      return;
    }

    try {
      // 1) Atualiza a prateleira
      const updatedQuantity =
        (Number(est.quantidade) || 0) + (Number(quantidade) || 0);
      const r1 = await fetch(withKey(`/estoques?id=eq.${est.id}`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: API_KEY,
        },
        body: JSON.stringify({ quantidade: updatedQuantity }),
      });
      if (!(r1.ok || r1.status === 204)) {
        const detail = await r1.text().catch(() => "");
        console.error(
          "[ADICIONAR] Falha ao atualizar prateleira:",
          r1.status,
          detail
        );
        throw new Error("Erro ao atualizar o estoque");
      }

      // 2) Atualiza o total do produto
      const novoTotal =
        (Number(produto?.quantidadeTotal) || 0) + (Number(quantidade) || 0);
      const r2 = await fetch(withKey(`/produtos?id=eq.${id_produto}`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: API_KEY,
        },
        body: JSON.stringify({ quantidadeTotal: novoTotal }),
      });
      if (!(r2.ok || r2.status === 204)) {
        const detail = await r2.text().catch(() => "");
        console.error(
          "[ADICIONAR] Falha ao atualizar produto:",
          r2.status,
          detail
        );
        throw new Error("Erro ao atualizar produto");
      }

      // 3) Estado local
      setEstoques((prev) =>
        prev.map((e) =>
          e.id === est.id ? { ...e, quantidade: updatedQuantity } : e
        )
      );
      setProduto((prev: any) =>
        prev ? { ...prev, quantidadeTotal: novoTotal } : prev
      );

      successToast(
        `+${quantidade} na prateleira ${getPrateleiraNameById(
          est.id_prateleira
        )} (novo: ${updatedQuantity})`
      );
      setIsAddModalOpen(false);
      setEstoqueParaAdicionar(null);

      // 4) Histórico
      await fetch(withKey(`/movimentacoes`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: API_KEY,
        },
        body: JSON.stringify({
          produto_id: produto?.id,
          tipo: "entrada",
          quantidade,
          user_email: localStorage.getItem("user_email") || null,
          prateleira_id: est.id_prateleira,
        }),
      });
    } catch (e) {
      console.error(e);
      errorToast("Erro ao processar a adição");
    }
  };

  /** ➖ Retirar quantidade da prateleira + atualizar quantidadeTotal do produto */
  const handleRetirada = async (quantidade: number) => {
    if (!estoqueSelecionado) return;

    const token = localStorage.getItem("supabase_jwt");
    if (!token) {
      setError("Token JWT não encontrado.");
      return;
    }

    const updatedQuantity =
      (Number(estoqueSelecionado.quantidade) || 0) - (Number(quantidade) || 0);
    if (updatedQuantity < 0) {
      setError("Quantidade insuficiente no estoque!");
      errorToast("Quantidade insuficiente no estoque!");
      return;
    }

    try {
      // 1) Atualiza a prateleira
      const r1 = await fetch(
        withKey(`/estoques?id=eq.${estoqueSelecionado.id}`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
            apikey: API_KEY,
          },
          body: JSON.stringify({ quantidade: updatedQuantity }),
        }
      );
      if (!(r1.ok || r1.status === 204)) {
        const detail = await r1.text().catch(() => "");
        console.error(
          "[RETIRAR] Falha ao atualizar prateleira:",
          r1.status,
          detail
        );
        throw new Error("Erro ao atualizar o estoque");
      }

      // 2) Atualiza o total do produto
      const novoTotal =
        (Number(produto?.quantidadeTotal) || 0) - (Number(quantidade) || 0);
      const r2 = await fetch(withKey(`/produtos?id=eq.${id_produto}`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: API_KEY,
        },
        body: JSON.stringify({ quantidadeTotal: Math.max(0, novoTotal) }),
      });
      if (!(r2.ok || r2.status === 204)) {
        const detail = await r2.text().catch(() => "");
        console.error(
          "[RETIRAR] Falha ao atualizar produto:",
          r2.status,
          detail
        );
        throw new Error("Erro ao atualizar produto");
      }

      // 3) Estado local
      setEstoques((prev) =>
        prev.map((e) =>
          e.id === estoqueSelecionado.id
            ? { ...e, quantidade: updatedQuantity }
            : e
        )
      );
      setProduto((prev: any) =>
        prev ? { ...prev, quantidadeTotal: Math.max(0, novoTotal) } : prev
      );

      successToast(
        `-${quantidade} na prateleira ${getPrateleiraNameById(
          estoqueSelecionado.id_prateleira
        )} (novo: ${updatedQuantity})`
      );
      setIsModalOpen(false);

      // 4) Histórico
      await fetch(withKey(`/movimentacoes`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          apikey: API_KEY,
        },
        body: JSON.stringify({
          produto_id: produto?.id,
          tipo: "saida",
          quantidade,
          user_email: localStorage.getItem("user_email") || null,
          prateleira_id: estoqueSelecionado.id_prateleira,
        }),
      });
    } catch (error) {
      console.error("Erro no processamento:", error);
      setError("Erro ao processar a retirada do estoque");
      errorToast("Erro ao processar a retirada do estoque");
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;

  const handleLogout = async () => {
    localStorage.removeItem("supabase_jwt");
    localStorage.removeItem("user_email");
    setUserEmail(null);
    if (isClient) router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header userEmail={userEmail} onLogout={handleLogout} />

      <div className="mt-20 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        {produto ? (
          <>
            <h2 className="text-3xl font-semibold text-center text-black mb-2">
              {produto.nome}
            </h2>
            <p className="text-center text-sm text-gray-600 mb-6">
              Quantidade Total: <b>{produto.quantidadeTotal ?? 0}</b>
            </p>
          </>
        ) : (
          <p className="text-center text-gray-500">Produto não encontrado.</p>
        )}

        {estoques.length === 0 ? (
          <p className="text-center text-gray-500">
            Não há estoques para este produto.
          </p>
        ) : (
          <div>
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Prateleira
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Quantidade
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Adicionar
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Retirar
                  </th>
                </tr>
              </thead>
              <tbody>
                {estoques.map((estoque: any) => (
                  <tr key={estoque.id}>
                    <td className="px-4 py-2">
                      {getPrateleiraNameById(estoque.id_prateleira)}
                    </td>
                    <td className="px-4 py-2">{estoque.quantidade}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          setEstoqueParaAdicionar(estoque);
                          setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Adicionar
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          setEstoqueSelecionado(estoque);
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Retirar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Retirar */}
      <Retirar
        estoqueId={estoqueSelecionado?.id || ""}
        quantidadeDisponivel={estoqueSelecionado?.quantidade || 0}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEstoqueSelecionado(null);
        }}
        onSubmit={handleRetirada}
      />

      {/* Modal de Adicionar — igual ao Retirar */}
      <Adicionar
        estoqueId={estoqueParaAdicionar?.id || ""}
        quantidadeAtual={estoqueParaAdicionar?.quantidade || 0}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEstoqueParaAdicionar(null);
        }}
        onSubmit={handleAdicionarSubmit}
      />

      <ToastNotifications />
    </div>
  );
};

export default RetirarEstoque;
