import { useEffect, useId, useState, type ReactNode } from 'react';

const formatar = (n: number): string => String(Math.round(n * 1e6) / 1e6).replace('.', ',');
const interpretar = (texto: string): number => parseFloat(texto.trim().replace(',', '.'));

interface CampoNumericoProps {
  rotulo: string;
  valor: number;
  onChange: (valor: number) => void;
  /** Sufixo exibido dentro do campo: "R$", "% a.a.", "meses"… */
  unidade?: string;
  min?: number;
  max?: number;
  dica?: ReactNode;
  /** true quando o valor atual é o padrão vindo do Banco Central. */
  doBc?: boolean;
}

/**
 * Campo numérico que aceita vírgula decimal. Só confirma o valor quando ele é válido
 * (dentro de min/max); enquanto a pessoa digita, mantém o texto como está.
 */
export function CampoNumerico({ rotulo, valor, onChange, unidade, min, max, dica, doBc }: CampoNumericoProps) {
  const id = useId();
  const [texto, setTexto] = useState(formatar(valor));
  const [focado, setFocado] = useState(false);

  // Mantém o texto em dia quando o valor muda por fora (ex.: taxas chegando do BC).
  useEffect(() => {
    if (!focado) setTexto(formatar(valor));
  }, [valor, focado]);

  const validar = (n: number) => Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max);
  const invalido = texto.trim() !== '' && !validar(interpretar(texto));

  return (
    <div className="fl-campo">
      <label htmlFor={id}>
        {rotulo}
        {doBc && <span className="fl-selo">valor do BC</span>}
      </label>
      <div className={invalido ? 'fl-campo-entrada fl-campo-entrada--erro' : 'fl-campo-entrada'}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={texto}
          aria-invalid={invalido}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          onChange={(e) => {
            setTexto(e.target.value);
            const n = interpretar(e.target.value);
            if (validar(n)) onChange(n);
          }}
        />
        {unidade && <span className="fl-campo-unidade">{unidade}</span>}
      </div>
      {invalido && (
        <small className="fl-campo-erro">
          Informe um número{min !== undefined && max !== undefined ? ` entre ${formatar(min)} e ${formatar(max)}` : min !== undefined ? ` a partir de ${formatar(min)}` : ''}.
        </small>
      )}
      {dica && <small className="fl-campo-dica">{dica}</small>}
    </div>
  );
}

interface CampoSelecaoProps<V extends string> {
  rotulo: string;
  valor: V;
  opcoes: { valor: V; rotulo: string }[];
  onChange: (valor: V) => void;
  dica?: ReactNode;
}

export function CampoSelecao<V extends string>({ rotulo, valor, opcoes, onChange, dica }: CampoSelecaoProps<V>) {
  const id = useId();
  return (
    <div className="fl-campo">
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value as V)}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {dica && <small className="fl-campo-dica">{dica}</small>}
    </div>
  );
}

interface CampoCaixaProps {
  rotulo: string;
  marcado: boolean;
  onChange: (marcado: boolean) => void;
  dica?: ReactNode;
}

export function CampoCaixa({ rotulo, marcado, onChange, dica }: CampoCaixaProps) {
  const id = useId();
  return (
    <div className="fl-campo fl-campo--caixa">
      <label htmlFor={id}>
        <input id={id} type="checkbox" checked={marcado} onChange={(e) => onChange(e.target.checked)} />
        {rotulo}
      </label>
      {dica && <small className="fl-campo-dica">{dica}</small>}
    </div>
  );
}
