const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const cell = String(value).replaceAll('"', '""');
  const needsQuotes = cell.includes(',') || cell.includes('\n') || cell.includes('"');

  return needsQuotes ? `"${cell}"` : cell;
};

export const buildCsvContent = (headers: string[], rows: Array<Array<unknown>>): string => {
  const csvRows = [headers.map(escapeCsvCell).join(',')];

  for (const row of rows) {
    csvRows.push(row.map(escapeCsvCell).join(','));
  }

  return csvRows.join('\n');
};

export const downloadCsv = (fileName: string, headers: string[], rows: Array<Array<unknown>>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const csvContent = buildCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
