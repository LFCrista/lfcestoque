"use client";

import React, { useState } from "react";

interface AdicionarProps {
  estoqueId: string;
  quantidadeAtual: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantidadeAdicionada: number) => void; // devolve o número digitado
}

/**
 * Modal de ADIÇÃO de itens ao estoque.
 * - Visual e UX idênticos ao de Retirar.
 * - Valida quantidade (> 0).
 * - Pergunta confirmação: "Confirma adicionar X livro(s)?"
 * - NÃO faz chamadas à API: só coleta o número e chama onSubmit(quantidade).
 */
const Adicionar: React.FC<AdicionarProps> = ({
  estoqueId,
  quantidadeAtual,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      setError("Quantidade inválida");
      return;
    }

    // Confirmação explícita do usuário
    const ok =
      typeof window !== "undefined"
        ? window.confirm(
            `Confirma adicionar ${quantidade} livro(s) ao estoque?`
          )
        : true;
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      onSubmit(quantidade); // devolve o número digitado para o pai
      setQuantidade(1);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido ao adicionar ao estoque");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
          Adicionar ao Estoque
        </h2>

        {error && (
          <div className="bg-red-500 text-white p-3 mb-4 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="quantidade"
              className="block text-sm font-medium text-gray-700"
            >
              Quantidade
            </label>
            <input
              type="number"
              id="quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              min={1}
              required
              className="w-full mt-1 p-4 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <small className="text-gray-500">Atual: {quantidadeAtual}</small>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Adicionar;
