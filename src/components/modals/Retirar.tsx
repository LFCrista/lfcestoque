// components/modals/Retirar.tsx
"use client";

import React, { useEffect, useState } from "react";

type RetirarProps = {
  estoqueId: string;
  quantidadeDisponivel: number;
  isOpen: boolean;
  onClose: () => void;
  // onSubmit deve executar a retirada no pai (page.tsx) e pode ser assíncrono
  onSubmit: (quantidade: number) => Promise<void> | void;
};

const Retirar: React.FC<RetirarProps> = ({
  estoqueId,
  quantidadeDisponivel,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // sempre que abrir o modal, zera estado
  useEffect(() => {
    if (isOpen) {
      setQuantidade(1);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validar = (qtd: number) => {
    if (!Number.isInteger(qtd) || qtd <= 0) {
      return "Informe um número inteiro positivo.";
    }
    if (qtd > quantidadeDisponivel) {
      return "Quantidade insuficiente no estoque.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar(quantidade);
    if (err) {
      setError(err);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // 🔑 entrega a quantidade digitada para o pai (page.tsx),
      // que executa o PATCH e atualiza os estados locais
      await onSubmit(quantidade);
      // sucesso → fecha o modal
      onClose();
    } catch (e: any) {
      // se o handler do pai lançar erro, mostra aqui
      setError(e?.message || "Erro ao atualizar o estoque");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
          Retirar do Estoque
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-500 px-3 py-2 text-white">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="qtd-retirar"
              className="block text-sm font-medium text-gray-700"
            >
              Quantidade
            </label>
            <input
              id="qtd-retirar"
              type="number"
              min={1}
              max={Math.max(1, quantidadeDisponivel)}
              value={quantidade}
              onChange={(e) =>
                setQuantidade(
                  e.target.value === ""
                    ? 1
                    : Math.max(1, Math.floor(Number(e.target.value)))
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Disponível: {quantidadeDisponivel}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Estoque ID: {estoqueId || "-"}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Processando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Retirar;
