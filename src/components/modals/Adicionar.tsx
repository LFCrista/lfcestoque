// components/modals/Adicionar.tsx
"use client";
import React, { useState, useEffect } from "react";

type Props = {
  estoqueId: string;
  quantidadeAtual?: number; // (opcional) só para exibir no modal
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantidade: number) => void; // devolve a quantidade a adicionar
};

export default function Adicionar({
  estoqueId,
  quantidadeAtual = 0,
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [qtd, setQtd] = useState<number>(1);

  useEffect(() => {
    if (isOpen) setQtd(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!Number.isInteger(qtd) || qtd <= 0) return;
    onSubmit(qtd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-semibold text-gray-900">
          Adicionar ao estoque
        </h3>

        <div className="mb-3 text-sm text-gray-600">
          <div>
            <b>Estoque ID:</b> {estoqueId || "-"}
          </div>
          <div>
            <b>Quantidade atual:</b> {quantidadeAtual}
          </div>
        </div>

        <label className="mb-4 block text-sm text-gray-700">
          Quantidade para adicionar
          <input
            type="number"
            min={1}
            value={qtd}
            onChange={(e) =>
              setQtd(
                e.target.value === ""
                  ? 1
                  : Math.max(1, Math.floor(Number(e.target.value)))
              )
            }
            className="mt-2 w-full rounded border border-gray-300 p-2 outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
