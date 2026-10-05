import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Texto para edição: vírgula decimal, sem separador de milhar. */
const formatar = (n: number): string => String(Math.round(n * 1e6) / 1e6).replace('.', ',');

/** Texto para exibição de valores em reais: 10.000,00. */
const formatarMoeda = (n: number): string => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Em campos de moeda o ponto é separador de milhar (10.000,00); nos demais, é decimal. */
const interpretar = (texto: string, moeda: boolean): number =>
  parseFloat((moeda ? texto.trim().replace(/\./g, '') : texto.trim()).replace(',', '.'));

/**
 * Máscara de reais enquanto se digita: separa os milhares com ponto e aceita a vírgula
 * para os centavos (até 2 casas). Devolve também onde o cursor deve ficar, pois ao
 * inserir pontos o navegador mandaria o cursor para o fim do texto.
 */
function mascararMoeda(bruto: string, cursor: number): { texto: string; cursor: number } {
  const ehSignificante = (c: string) => /[\d,]/.test(c);
  const temVirgula = bruto.includes(',');
  const [parteInteira, ...resto] = bruto.split(',');
  const centavos = resto.join('').replace(/\D/g, '').slice(0, 2);
  const digitosInteiros = parteInteira.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

  const inteiraFormatada = digitosInteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const adicionouZero = temVirgula && inteiraFormatada === '';
  const texto = (adicionouZero ? '0' : inteiraFormatada) + (temVirgula ? ',' + centavos : '');

  // Quantos caracteres "significativos" (dígitos e vírgula) havia antes do cursor.
  let alvo = [...bruto.slice(0, cursor)].filter(ehSignificante).length + (adicionouZero ? 1 : 0);
  let posicao = 0;
  for (; posicao < texto.length && alvo > 0; posicao++) if (ehSignificante(texto[posicao])) alvo--;
  return { texto, cursor: posicao };
}

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
  /** Valor em reais: formatado como 10.000,00 enquanto se digita. */
  moeda?: boolean;
}

/**
 * Campo numérico que aceita vírgula decimal. Só confirma o valor quando ele é válido
 * (dentro de min/max); enquanto a pessoa digita, mantém o texto como está.
 * Com `moeda`, formata em reais (10.000,00) enquanto a pessoa digita.
 */
export function CampoNumerico({ rotulo, valor, onChange, unidade, min, max, dica, doBc, moeda = false }: CampoNumericoProps) {
  const id = useId();
  const exibir = (n: number) => (moeda ? formatarMoeda(n) : formatar(n));
  const [texto, setTexto] = useState(exibir(valor));
  const [focado, setFocado] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const cursorPendente = useRef<number | null>(null);

  // Depois que a máscara reescreve o texto, devolve o cursor ao lugar certo.
  useLayoutEffect(() => {
    if (cursorPendente.current !== null && entrada.current) {
      entrada.current.setSelectionRange(cursorPendente.current, cursorPendente.current);
      cursorPendente.current = null;
    }
  }, [texto]);

  // Mantém o texto em dia quando o valor muda por fora (ex.: taxas chegando do BC)
  // e reformata ao sair do campo.
  useEffect(() => {
    if (!focado) setTexto(moeda ? formatarMoeda(valor) : formatar(valor));
  }, [valor, focado, moeda]);

  const validar = (n: number) => Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max);
  const invalido = texto.trim() !== '' && !validar(interpretar(texto, moeda));

  return (
    <div className="fl-campo">
      <label htmlFor={id}>
        {rotulo}
        {doBc && <span className="fl-selo">valor do BC</span>}
      </label>
      <div className={invalido ? 'fl-campo-entrada fl-campo-entrada--erro' : 'fl-campo-entrada'}>
        <input
          id={id}
          ref={entrada}
          type="text"
          inputMode="decimal"
          value={texto}
          aria-invalid={invalido}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          onChange={(e) => {
            let novoTexto = e.target.value;
            if (moeda) {
              const mascarado = mascararMoeda(novoTexto, e.target.selectionStart ?? novoTexto.length);
              novoTexto = mascarado.texto;
              cursorPendente.current = mascarado.cursor;
            }
            setTexto(novoTexto);
            const n = interpretar(novoTexto, moeda);
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
