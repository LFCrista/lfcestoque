// 'use client';

import { useState, useEffect, useCallback } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { successToast, errorToast } from "../../components/ToastNotifications";
import { ToastContainer } from "react-toastify";

export default function PrateleirasPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [prateleiras, setPrateleiras] = useState<any[]>([]);
  const [produtosPorPrateleira, setProdutosPorPrateleira] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedPrateleiraId, setSelectedPrateleiraId] = useState<
    string | null
  >(null);
  const router = useRouter();

  // ✅ useCallback p/ evitar warning de deps no useEffect
  const checkUserLoggedIn = useCallback(() => {
    const jwt =
      typeof window !== "undefined"
        ? localStorage.getItem("supabase_jwt")
        : null;
    if (!jwt) {
      router.push("/error");
    }
  }, [router]);

  const onLogout = async (): Promise<void> => {
    try {
      localStorage.removeItem("supabase_jwt");
      localStorage.removeItem("user_email");
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  useEffect(() => {
    checkUserLoggedIn(); // ✅ agora sem warning

    const fetchUserEmail = () => {
      const email = localStorage.getItem("user_email");
      setUserEmail(email);
    };

    const fetchData = async () => {
      // prateleiras
      const { data: prateleirasData, error: prateleirasError } = await supabase
        .from("prateleiras")
        .select("*");

      if (prateleirasError) {
        console.error("Erro ao carregar prateleiras:", prateleirasError);
        // errorToast('Erro ao carregar prateleiras.');
      } else {
        setPrateleiras(prateleirasData || []);
      }

      // produtos por prateleira
      prateleirasData?.forEach(async (prateleira: any) => {
        const { data: produtosData, error: produtosError } = await supabase
          .from("estoques")
          .select("produtos(*)")
          .eq("id_prateleira", prateleira.id);

        if (produtosError) {
          console.error(
            `Erro ao carregar produtos da prateleira ${prateleira.id}:`,
            produtosError
          );
          // errorToast(`Erro ao carregar produtos da prateleira ${prateleira.id}.`);
        } else {
          setProdutosPorPrateleira((prev: any) => ({
            ...prev,
            [prateleira.id]:
              (produtosData?.length || 0) > 0
                ? produtosData!.map((estoque: any) => estoque.produtos)
                : "Nenhum produto armazenado",
          }));
        }
      });
    };

    fetchUserEmail();
    fetchData();
  }, [checkUserLoggedIn]); // ✅ dependência corrigida

  const filteredPrateleiras = prateleiras.filter((p) =>
    (p?.nome || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedPrateleiraId) return;

    try {
      const { error } = await supabase
        .from("prateleiras")
        .delete()
        .eq("id", selectedPrateleiraId);

      if (error) {
        console.error("Erro ao excluir a prateleira:", error.message);
        errorToast("Erro ao excluir a prateleira. Tente novamente.");
      } else {
        setPrateleiras((prev) =>
          prev.filter((p) => p.id !== selectedPrateleiraId)
        );
        successToast("Prateleira excluída com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao excluir prateleira:", error);
      errorToast("Erro ao excluir a prateleira. Tente novamente.");
    } finally {
      setShowModal(false);
    }
  };

  const openModal = (id: string) => {
    setSelectedPrateleiraId(id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPrateleiraId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header userEmail={userEmail} onLogout={onLogout} />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          Prateleiras e Produtos
        </h1>

        {/* Busca */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prateleira pelo nome"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Criar prateleira */}
        <div className="mb-4 text-right">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            onClick={() => router.push("/prateleiras/criar")} // ✅ Next navigation
          >
            Criar Prateleira
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-6 py-3 font-semibold text-gray-800">
                  Prateleira
                </th>
                <th className="px-6 py-3 font-semibold text-gray-800">
                  Produtos
                </th>
                <th className="px-6 py-3 font-semibold text-gray-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrateleiras.length > 0 ? (
                filteredPrateleiras.map((prateleira) => (
                  <tr key={prateleira.id} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {prateleira.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {produtosPorPrateleira[prateleira.id] ===
                      "Nenhum produto armazenado" ? (
                        <span className="text-gray-500">
                          Nenhum produto armazenado
                        </span>
                      ) : (
                        <ul className="list-disc pl-5">
                          {produtosPorPrateleira[prateleira.id]?.map(
                            (produto: any) => (
                              <li key={produto.SKU}>
                                <strong>{produto.nome}</strong> (SKU:{" "}
                                {produto.SKU}, Código de Barras:{" "}
                                {produto.codBarras})
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <button
                        onClick={() => openModal(prateleira.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/prateleiras/edit/${prateleira.id}`)
                        } // ✅ Next navigation
                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nenhuma prateleira encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mt-2">
              Você tem certeza que deseja excluir esta prateleira?
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
