/**
 * Client-side CSV Exporter Utility
 * Cleanly exports arrays of structured tabular records or header/row arrays to CSV format.
 * Automatically handles quote escaping, commas, newlines, and timestamped filenames.
 */

export function exportTableToCsv(
  filenamePrefix: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  if (typeof window === 'undefined') return;

  try {
    const formattedHeaders = headers.map((h) => escapeCsvCell(h)).join(',');
    const formattedRows = rows.map((row) =>
      row.map((cell) => escapeCsvCell(cell)).join(',')
    );

    const csvContent = [formattedHeaders, ...formattedRows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const dateStamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filenamePrefix}_${dateStamp}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fullFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export CSV:', err);
  }
}

function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  // If the string contains comma, double quote, or newline, escape it
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
