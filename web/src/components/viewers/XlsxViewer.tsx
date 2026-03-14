import * as XLSX from "xlsx";
import { useMemo, useState, useRef, useCallback } from "react";

type XlsxViewerProps = {
  content: string;
};

const PAGE_SIZE = 200;

export default function XlsxViewer({ content }: XlsxViewerProps) {
  const { sheets, sheetNames, error } = useMemo(() => {
    if (!content) return { sheets: [], sheetNames: [], error: null as string | null };
    try {
      const base64 = content.startsWith("data:")
        ? content.substring(content.indexOf(",") + 1)
        : content;
      const wb = XLSX.read(base64, { type: "base64" });
      const names = wb.SheetNames;
      const parsed = names.map((name) => {
        const sheet = wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        return { name, data };
      });
      return { sheets: parsed, sheetNames: names, error: null as string | null };
    } catch (e) {
      return { sheets: [], sheetNames: [], error: String(e) };
    }
  }, [content]);

  const [activeSheet, setActiveSheet] = useState(0);
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  const sheet = sheets[activeSheet];
  const headerRow = sheet?.data?.[0];
  const totalRows = (sheet?.data?.length ?? 1) - 1;

  const colCount = useMemo(() => {
    if (!sheet?.data?.length) return 0;
    let max = 0;
    for (const row of sheet.data) {
      if (Array.isArray(row) && row.length > max) max = row.length;
    }
    return max;
  }, [sheet]);

  const columns = useMemo(() => {
    if (!headerRow || !Array.isArray(headerRow)) return [];
    const cols: string[] = [];
    for (let i = 0; i < colCount; i++) {
      cols.push(headerRow[i] != null ? String(headerRow[i]) : toColLetter(i));
    }
    return cols;
  }, [headerRow, colCount]);

  const dataRows = useMemo(() => {
    if (!sheet?.data) return [];
    return sheet.data.slice(1, 1 + visibleRows);
  }, [sheet, visibleRows]);

  const handleScroll = useCallback(() => {
    const el = tableBodyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40 && visibleRows < totalRows) {
      setVisibleRows((v) => Math.min(v + PAGE_SIZE, totalRows));
    }
  }, [visibleRows, totalRows]);

  const handleSheetChange = useCallback((idx: number) => {
    setActiveSheet(idx);
    setVisibleRows(PAGE_SIZE);
    tableBodyRef.current?.scrollTo(0, 0);
  }, []);

  if (error) return <div style={S.empty}>{error}</div>;
  if (!content) return <div style={S.empty}>暂无 XLSX 内容</div>;
  if (!sheet) return <div style={S.empty}>空工作簿</div>;

  return (
    <div style={S.root}>
      {/* spreadsheet area */}
      <div style={S.tableWrap} ref={tableBodyRef} onScroll={handleScroll}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.rowNumHeader}>#</th>
              {columns.map((col, i) => (
                <th key={i} style={S.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={ri % 2 === 0 ? undefined : S.stripedRow}>
                <td
                  style={{
                    ...S.rowNum,
                    ...(ri % 2 === 1 ? { background: "var(--ide-stripe, rgba(255,255,255,0.04))" } : {}),
                  }}
                >
                  {ri + 1}
                </td>
                {Array.from({ length: colCount }, (_, ci) => {
                  const val = Array.isArray(row) ? row[ci] : undefined;
                  const isNum = typeof val === "number";
                  return (
                    <td key={ci} style={isNum ? S.tdNum : S.td}>
                      {val != null ? String(val) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {visibleRows < totalRows && (
          <div style={S.loadMore}>
            已显示 {visibleRows} / {totalRows} 行，继续滚动加载更多…
          </div>
        )}
      </div>

      {/* sheet tabs */}
      {sheetNames.length > 1 && (
        <div style={S.tabBar}>
          {sheetNames.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSheetChange(i)}
              style={i === activeSheet ? S.tabActive : S.tab}
            >
              {name}
            </button>
          ))}
          <div style={S.tabBarRight}>
            <span style={S.sheetInfo}>
              {totalRows} 行 × {colCount} 列
            </span>
          </div>
        </div>
      )}

      {sheetNames.length <= 1 && (
        <div style={S.tabBar}>
          <span style={{ ...S.sheetInfo, padding: "0 12px" }}>
            {sheetNames[0] ?? "Sheet1"} — {totalRows} 行 × {colCount} 列
          </span>
        </div>
      )}
    </div>
  );
}

function toColLetter(n: number): string {
  let s = "";
  let num = n;
  while (num >= 0) {
    s = String.fromCharCode((num % 26) + 65) + s;
    num = Math.floor(num / 26) - 1;
  }
  return s;
}

const BORDER = "1px solid var(--ide-sidebar-border, rgba(255,255,255,0.12))";
const BORDER_LEFT = "1px solid var(--ide-sidebar-border, rgba(255,255,255,0.12))";
const HEADER_BORDER = "2px solid var(--ide-sidebar-border, rgba(255,255,255,0.15))";
const CELL_PAD = "8px 12px";
const DATA_COL_MIN = 72;
const DATA_COL_MAX = 280;

const S: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: "var(--ide-bg, #0f0f1a)",
  },
  empty: {
    padding: 24,
    color: "var(--ide-text-muted, #8b8f99)",
  },
  tableWrap: {
    flex: 1,
    overflow: "auto",
    position: "relative",
    padding: 12,
  },
  table: {
    width: "100%",
    minWidth: "max-content",
    borderCollapse: "collapse",
    fontSize: 13,
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, 'Courier New', monospace",
    background: "var(--ide-bg-elevated, #16161f)",
    boxShadow: "0 0 0 1px var(--ide-sidebar-border, rgba(255,255,255,0.08))",
    borderRadius: 6,
    overflow: "hidden",
  },
  rowNumHeader: {
    position: "sticky",
    top: 0,
    left: 0,
    zIndex: 3,
    background: "var(--ide-header, #1a1a26)",
    borderBottom: HEADER_BORDER,
    borderRight: BORDER,
    borderLeft: BORDER_LEFT,
    padding: CELL_PAD,
    textAlign: "center",
    color: "var(--ide-text-muted, #8b8f99)",
    fontWeight: 600,
    fontSize: 11,
    minWidth: 48,
    maxWidth: 48,
    userSelect: "none",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "var(--ide-header, #1a1a26)",
    borderBottom: HEADER_BORDER,
    borderRight: BORDER,
    padding: CELL_PAD,
    textAlign: "left",
    fontWeight: 600,
    color: "var(--ide-text, #e4e6eb)",
    whiteSpace: "nowrap",
    fontSize: 12,
    minWidth: DATA_COL_MIN,
    maxWidth: DATA_COL_MAX,
    userSelect: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowNum: {
    position: "sticky",
    left: 0,
    zIndex: 1,
    background: "var(--ide-bg-elevated, #16161f)",
    borderBottom: BORDER,
    borderRight: BORDER,
    borderLeft: BORDER_LEFT,
    padding: CELL_PAD,
    textAlign: "center",
    color: "var(--ide-text-muted, #8b8f99)",
    fontSize: 11,
    minWidth: 48,
    maxWidth: 48,
    userSelect: "none",
  },
  td: {
    borderBottom: BORDER,
    borderRight: BORDER,
    padding: CELL_PAD,
    color: "var(--ide-text, #e4e6eb)",
    whiteSpace: "nowrap",
    minWidth: DATA_COL_MIN,
    maxWidth: DATA_COL_MAX,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tdNum: {
    borderBottom: BORDER,
    borderRight: BORDER,
    padding: CELL_PAD,
    color: "var(--ide-accent, #a78bfa)",
    whiteSpace: "nowrap",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    minWidth: DATA_COL_MIN,
    maxWidth: DATA_COL_MAX,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  stripedRow: {
    background: "var(--ide-stripe, rgba(255,255,255,0.04))",
  },
  loadMore: {
    padding: "12px 16px",
    textAlign: "center",
    color: "var(--ide-text-muted, #8b8f99)",
    fontSize: 12,
  },

  tabBar: {
    display: "flex",
    alignItems: "center",
    borderTop: BORDER,
    background: "var(--ide-header, #0d0d18)",
    flexShrink: 0,
    height: 32,
    overflow: "hidden",
  },
  tab: {
    all: "unset",
    padding: "0 16px",
    height: 32,
    lineHeight: "32px",
    fontSize: 12,
    color: "var(--ide-text-muted, #8b8f99)",
    cursor: "pointer",
    borderRight: BORDER,
    transition: "background .15s, color .15s",
    whiteSpace: "nowrap",
  },
  tabActive: {
    all: "unset",
    padding: "0 16px",
    height: 32,
    lineHeight: "32px",
    fontSize: 12,
    color: "var(--ide-accent, #a78bfa)",
    cursor: "pointer",
    borderRight: BORDER,
    background: "var(--ide-tab-active-bg, #2d1d52)",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  tabBarRight: {
    marginLeft: "auto",
    paddingRight: 12,
    flexShrink: 0,
  },
  sheetInfo: {
    fontSize: 11,
    color: "var(--ide-text-muted, #8b8f99)",
  },
};
