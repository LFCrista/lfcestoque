"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";

// 🔑 Config Supabase p/ REST no browser
const API_BASE = "https://eyezlckotjducyuknbel.supabase.co/rest/v1";
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// debug — precisa imprimir TRUE
console.log("LISTA | API_KEY presente?", !!API_KEY);

// helper: inclui apikey também na URL
const withKey = (path: string) =>
  `${API_BASE}${path}${path.includes("?") ? "&" : "?"}apikey=${API_KEY}`;

// headers padrão (só adicione Content-Type quando for PATCH/POST)
const makeHeaders = (token?: string) => ({
  Authorization: token ? `Bearer ${token}` : "",
  apikey: API_KEY,
});

export default function Produtos() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState<string>("codBarras"); // filtro

  useEffect(() => {
    const token = localStorage.getItem("supabase_jwt");
    if (!token) {
      setError("Token JWT não encontrado.");
      router.push("/error");
      return;
    }

    const userEmailFromToken = localStorage.getItem("user_email");
    setUserEmail(userEmailFromToken);

    const fetchProdutos = async () => {
      try {
        // ✅ apikey no header E na URL
        const url = withKey(
          "/estoques?select=id_produto,id_prateleira,prateleiras(nome),produtos(nome,SKU,codBarras,quantidadeTotal)"
        );

        const response = await fetch(url, {
          method: "GET",
          headers: makeHeaders(token),
        });

        if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(
            `Erro ao carregar os dados. Status: ${response.status}, Mensagem: ${errorDetails}`
          );
        }

        const data = await response.json();
        setProdutos(data);
        setFilteredProdutos(data);
      } catch (err: any) {
        console.error("Erro ao buscar os produtos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, [router]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredProdutos(
        produtos.filter((produto: any) =>
          (produto.produtos?.[searchBy] || "")
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredProdutos(produtos);
    }
  }, [searchTerm, produtos, searchBy]);

  if (loading) return <div className="text-center">Carregando...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  // agrupa prateleiras por produto
  const produtosAgrupados = filteredProdutos.reduce(
    (acc: any[], produto: any) => {
      const existente = acc.find(
        (item: any) => item.id_produto === produto.id_produto
      );
      if (existente) {
        existente.prateleiras += `, ${produto.prateleiras?.nome ?? "-"}`;
      } else {
        acc.push({
          id_produto: produto.id_produto,
          nome: produto.produtos?.nome ?? "-",
          SKU: produto.produtos?.SKU ?? "-",
          codBarras: produto.produtos?.codBarras ?? "-",
          prateleiras: produto.prateleiras?.nome ?? "-",
          quantidadeTotal: produto.produtos?.quantidadeTotal ?? 0,
        });
      }
      return acc;
    },
    []
  );

  const formatarPrateleiras = (prateleiras: string) => {
    const arr = prateleiras.split(", ");
    return arr.length > 3 ? `${arr.slice(0, 3).join(", ")}...` : prateleiras;
  };

  const handleRetirarClick = (id_produto: string) => {
    router.push(`/estoque/retirar/${id_produto}`);
  };

  const handleLogout = async () => {
    localStorage.removeItem("supabase_jwt");
    localStorage.removeItem("user_email");
    await router.push("/login");
  };

  return (
    <div>
      <Header userEmail={userEmail} onLogout={handleLogout} />

      <div className="container mx-auto p-6">
        <button
          onClick={() => router.push("/estoque/cadastrar")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Cadastrar Estoque
        </button>
      </div>

      <div className="container mx-auto p-6 flex items-center">
        <select
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          className="mr-4 p-2 border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="codBarras">Código de Barras</option>
          <option value="SKU">SKU</option>
          <option value="nome">Nome</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Buscar por ${searchBy}...`}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="container mx-auto p-6">
        <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">
                Produto
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">
                SKU
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">
                Código de Barras
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">
                Prateleiras
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">
                Quantidade Total
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-600">
                Retirar
              </th>
            </tr>
          </thead>
          <tbody>
            {produtosAgrupados.length > 0 ? (
              produtosAgrupados.map((produto: any) => (
                <tr
                  key={`${produto.id_produto}-${produto.prateleiras}`}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-6 text-sm text-gray-800">
                    {produto.nome}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-800">
                    {produto.SKU}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-800">
                    {produto.codBarras}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-800">
                    {formatarPrateleiras(produto.prateleiras)}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-800">
                    {produto.quantidadeTotal}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-800">
                    <button
                      onClick={() => handleRetirarClick(produto.id_produto)}
                      className="text-blue-600 hover:underline"
                    >
                      Retirar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-3 text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
