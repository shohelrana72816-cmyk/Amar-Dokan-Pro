export const formatCurrency = (amount: number, lang: 'bn' | 'en' = 'bn'): string => {
  const rounded = Math.round(amount);
  const formattedEn = new Intl.NumberFormat('en-BD', {
    maximumFractionDigits: 0,
  }).format(rounded);

  if (lang === 'en') {
    return `৳${formattedEn}`;
  }

  // Convert to Bengali digits
  const bnDigits: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };

  const formattedBn = formattedEn.replace(/\d/g, (d) => bnDigits[d] || d);
  return `৳${formattedBn}`;
};

export const toBnNumber = (num: number | string): string => {
  const bnDigits: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(num).replace(/\d/g, (d) => bnDigits[d] || d);
};

export const formatDate = (isoString: string, lang: 'bn' | 'en' = 'bn'): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    const bnMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const enMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    if (lang === 'bn') {
      return `${toBnNumber(day)} ${bnMonths[monthIndex]}, ${toBnNumber(year)}`;
    }
    return `${day} ${enMonths[monthIndex]} ${year}`;
  } catch {
    return isoString;
  }
};

export const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${randomSuffix}`;
};

export const exportToCSV = (filename: string, rows: (string | number)[][]) => {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let stringVal = val === null || val === undefined ? '' : String(val);
      if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n')) {
        stringVal = `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(',');
  };

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
