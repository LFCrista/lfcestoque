'use client';

import React, { useEffect, useState } from 'react';
import Retirar from '../../../../components/modals/Retirar'; // Importando o componente Modal
import { useParams } from 'next/navigation'; // Usando useParams para pegar o id_produto da URL
import Header from '../../../../components/Header'; // Importando o Header
import { useRouter } from 'next/navigation'; // Importando o useRouter de next/navigation para navegação
import { ToastNotifications, successToast, errorToast } from '../../../../components/ToastNotifications'; // Importando as funções de toast

const RetirarEstoque = () => {
  const [estoques, setEstoques] = useState<any[]>([]);  // Estado para armazenar os estoques
  const [prateleiras, setPrateleiras] = useState<any[]>([]);  // Estado para armazenar as prateleiras
  const [produto, setProduto] = useState<any | null>(null);  // Estado para armazenar as informações do produto
  const [loading, setLoading] = useState<boolean>(true);  // Estado de carregamento
  const [error, setError] = useState<string | null>(null);  // Estado para armazenar erros
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);  // Estado para controlar se o modal está aberto
  const [estoqueSelecionado, setEstoqueSelecionado] = useState<any | null>(null);  // Estado para armazenar o estoque selecionado
  const [userEmail, setUserEmail] = useState<string | null>(null);  // Estado para armazenar o email do usuário
  const [isClient, setIsClient] = useState(false); // Estado para verificar se estamos no lado do cliente

  const { id_produto } = useParams();  // Pegando o id_produto da URL
  const router = useRouter(); // Usando o hook useRouter de next/navigation para navegação

  useEffect(() => {
    // Definindo que o componente está sendo executado no cliente
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Verifica se o usuário está logado e recupera o email do localStorage
    const userEmailFromToken = localStorage.getItem('user_email');
    setUserEmail(userEmailFromToken);
  }, []);  // Esse efeito é executado apenas uma vez, quando o componente é montado

  useEffect(() => {
    const fetchData = async () => {
      if (!id_produto) return;  // Verifica se o id_produto está presente

      setLoading(true);
      try {
        // Fetch dos estoques usando o id_produto dinamicamente
        const estoqueResponse = await fetch(`https://eyezlckotjducyuknbel.supabase.co/rest/v1/estoques?id_produto=eq.${id_produto}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_jwt')}`,
            'apikey': process.env.SUPABASE_KEY || '',
          },
        });

        if (!estoqueResponse.ok) {
          throw new Error('Erro ao buscar os estoques');
        }

        const estoqueData = await estoqueResponse.json();
        setEstoques(estoqueData);

        // Fetch das prateleiras
        const prateleiraResponse = await fetch('https://eyezlckotjducyuknbel.supabase.co/rest/v1/prateleiras', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_jwt')}`,
            'apikey': process.env.SUPABASE_KEY || '',
          },
        });

        if (!prateleiraResponse.ok) {
          throw new Error('Erro ao buscar as prateleiras');
        }

        const prateleiraData = await prateleiraResponse.json();
        setPrateleiras(prateleiraData);

        // Fetch do produto
        const produtoResponse = await fetch(`https://eyezlckotjducyuknbel.supabase.co/rest/v1/produtos?id=eq.${id_produto}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_jwt')}`,
            'apikey': process.env.SUPABASE_KEY || '',
          },
        });

        if (!produtoResponse.ok) {
          throw new Error('Erro ao buscar o produto');
        }

        const produtoData = await produtoResponse.json();
        setProduto(produtoData[0]);  // Armazena o produto

      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Erro desconhecido');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_produto]);  // O efeito é reexecutado sempre que o id_produto mudar

  const getPrateleiraNameById = (id: string) => {
    const prateleira = prateleiras.find((prateleira) => prateleira.id === id);
    return prateleira ? prateleira.nome : 'Desconhecida';
  };

  const handleRetirarClick = (estoque: any) => {
    setEstoqueSelecionado(estoque);  // Armazena o estoque selecionado
    setIsModalOpen(true);  // Abre o modal
  };

  const handleModalClose = () => {
    setIsModalOpen(false);  // Fecha o modal
    setEstoqueSelecionado(null);  // Reseta o estoque selecionado
  };

  const handleRetirada = async (quantidade: number) => {
    if (estoqueSelecionado) {
      const token = localStorage.getItem('supabase_jwt');
      if (!token) {
        setError('Token JWT não encontrado.');
        return;
      }

      // Subtrai a quantidade do estoque
      const updatedQuantity = estoqueSelecionado.quantidade - quantidade;
      
      if (updatedQuantity < 0) {
        setError('Quantidade insuficiente no estoque!');
        errorToast('Quantidade insuficiente no estoque!');
        return;
      }

      try {
        // Atualizando a quantidade no estoque
        const updateEstoqueResponse = await fetch(
          `https://eyezlckotjducyuknbel.supabase.co/rest/v1/estoques?id=eq.${estoqueSelecionado.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_KEY || '',
            },
            body: JSON.stringify({
              quantidade: updatedQuantity,
            }),
          }
        );

        if (!updateEstoqueResponse.ok) {
          const errorDetails = await updateEstoqueResponse.text();
          console.error('Erro ao atualizar estoque:', errorDetails);
          throw new Error('Erro ao atualizar estoque');
        }

        // Agora, subtrai da quantidadeTotal no produto
        const produtoResponse = await fetch(
          `https://eyezlckotjducyuknbel.supabase.co/rest/v1/produtos?id=eq.${id_produto}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_KEY || '',
            },
          }
        );

        const produtoData = await produtoResponse.json();
        const produtoAtual = produtoData[0];
        const quantidadeTotalAtual = produtoAtual?.quantidadeTotal ?? 0;
        const quantidadeTotalAtualizada = quantidadeTotalAtual - quantidade;

        const updateProdutoResponse = await fetch(
          `https://eyezlckotjducyuknbel.supabase.co/rest/v1/produtos?id=eq.${id_produto}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_KEY || '',
            },
            body: JSON.stringify({
              quantidadeTotal: quantidadeTotalAtualizada,
            }),
          }
        );

        if (!updateProdutoResponse.ok) {
          const errorDetails = await updateProdutoResponse.text();
          console.error('Erro ao atualizar produto:', errorDetails);
          throw new Error('Erro ao atualizar produto');
        }

        // Atualizando o estado local
        setEstoques((prev) =>
          prev.map((estoque) =>
            estoque.id === estoqueSelecionado.id
              ? { ...estoque, quantidade: updatedQuantity }
              : estoque
          )
        );

        successToast('Produto retirado com sucesso!');
        setIsModalOpen(false);  // Fecha o modal
      } catch (error) {
        console.error('Erro no processamento:', error);
        setError('Erro ao processar a retirada do estoque');
        errorToast('Erro ao processar a retirada do estoque');
      }
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p>Erro: {error}</p>;
  }

  const handleLogout = async () => {
    localStorage.removeItem('supabase_jwt');
    localStorage.removeItem('user_email');
    setUserEmail(null);

    // Verifica se o código está sendo executado no cliente antes de usar o router
    if (isClient) {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header fixo no topo */}
      <Header userEmail={userEmail} onLogout={handleLogout} />

      {/* Conteúdo com margem superior para evitar sobreposição */}
      <div className="mt-20 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        {produto ? (
          <h2 className="text-3xl font-semibold text-center text-black mb-6">
            {produto.nome} {/* Exibindo o nome do produto */}
          </h2>
        ) : (
          <p className="text-center text-gray-500">Produto não encontrado.</p>
        )}

        {estoques.length === 0 ? (
          <p className="text-center text-gray-500">Não há estoques para este produto.</p>
        ) : (
          <div>
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prateleira</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantidade</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Retirar</th>
                </tr>
              </thead>
              <tbody>
                {estoques.map((estoque: any) => (
                  <tr key={estoque.id}>
                    <td className="px-4 py-2">{getPrateleiraNameById(estoque.id_prateleira)}</td>
                    <td className="px-4 py-2">{estoque.quantidade}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRetirarClick(estoque)}
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
        estoqueId={estoqueSelecionado?.id || ''}
        quantidadeDisponivel={estoqueSelecionado?.quantidade || 0}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleRetirada}
      />

      {/* Componente ToastNotifications */}
      <ToastNotifications />
    </div>
  );
};

export default RetirarEstoque;
