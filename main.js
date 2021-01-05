const createNode = node => typeof node === 'string' ? document.createTextNode(node) : node;

const h = (tagName, children) => {
  const el = document.createElement(tagName);
  if (Array.isArray(children)) {
    children.forEach(child => el.appendChild(createNode(child)));
  } else {
    el.appendChild(createNode(children));
  }
  return el;
};

const SimpleFormatter = formatter => ({
  format(amount) {
    return [
      {
        value: formatter.format(amount),
        type: 'integer',
      },
    ];
  },
});

const MoneyTokenizer = parts => {
  const regexp = /([ig]+l?d?l?)|(l?cl?)|(f)/g;
  const tokenTypes = ['integer', 'currency', 'fraction'];
  const codifiedParts = parts.map(part => part.type.substring(0, 1)).join('');
  const transformToken = (position, codifiedPart) => {
    return codifiedPart
      .split('')
      .map((_, index) => {
        return parts[position + index].value;
      })
      .join('');
  };
  const getToken = matches => {
    const tokenIndex = matches.slice(1).findIndex(match => match);
    return {
      value: transformToken(matches.index, matches[tokenIndex + 1]),
      type: tokenTypes[tokenIndex],
    };
  };
  return {
    getToken() {
      const matches = regexp.exec(codifiedParts);
      return matches && getToken(matches);
    },
  };
};

const PartsFormatter = formatter => ({
  format(amount) {
    const parts = formatter.formatToParts(amount);
    const tokenizer = MoneyTokenizer(parts);
    const moneyParts = [];
    let token = tokenizer.getToken();
    while (token) {
      moneyParts.push(token);
      token = tokenizer.getToken();
    }
    return moneyParts;
  },
});

const SpecialNumberLocaleFormatter = (
  currencyLocaleFormatter,
  numberLocaleFormatter,
  styled
) => ({
  format(amount) {
    const numberLocaleParts = new Map(
      numberLocaleFormatter.format(amount).map(part => [part.type, part])
    );
    const currencyLocaleParts = currencyLocaleFormatter.format(amount);
    const moneyParts = currencyLocaleParts.map(part =>
      part.type !== 'currency' ? numberLocaleParts.get(part.type) : part
    );
    if (styled) {
      return moneyParts;
    }
    return [
      {
        type: 'default',
        value: toMoneyText(moneyParts),
      },
    ];
  },
});

const browserDoesNotSupportFormatToParts = formatter =>
  typeof formatter.formatToParts !== 'function';

const createFormatter = (currency, locale, minimumFractionDigits) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
  });

const MoneyFormatter = (
  { locale, numberLocale, minimumFractionDigits },
  currency,
  styled
) => {
  const formatter = createFormatter(currency, locale, minimumFractionDigits);
  if (
    (!styled && !numberLocale) ||
    browserDoesNotSupportFormatToParts(formatter)
  ) {
    return SimpleFormatter(formatter);
  }
  const partsFormatter = PartsFormatter(formatter);
  if (!numberLocale) {
    return partsFormatter;
  }
  return SpecialNumberLocaleFormatter(
    partsFormatter,
    PartsFormatter(
      createFormatter(currency, numberLocale, minimumFractionDigits)
    ),
    styled
  );
};

const test1 = amount => {
  try {
    const locale = {
      locale: 'en-UK'
    };
    const currency = 'USD';
    const moneyParts = new Intl.NumberFormat(locale.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
    return JSON.stringify(moneyParts);
  } catch (error) {
    return error.message;
  }
};

const simpleFormatterTest = amount => {
  try {
    const locale = {
      locale: 'en-UK'
    };
    const currency = 'USD';
    const formatter = SimpleFormatter(locale, currency, true);
    const moneyParts = formatter.format(amount);
    return JSON.stringify(moneyParts);
  } catch (error) {
    return error.message;
  }
};

const browserSupportTest = ()  => {
  const locale = {
    locale: 'en-UK'
  };
  const currency = 'USD';
  const formatter =  new Intl.NumberFormat(locale.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  return browserDoesNotSupportFormatToParts(formatter).toString();
};

const formatToPartsTest = amount => {
  try {
    const locale = {
      locale: 'en-UK'
    };
    const currency = 'USD';
    const formatter =  new Intl.NumberFormat(locale.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    });
    const moneyParts = formatter.formatToParts(amount);
    return JSON.stringify(moneyParts);
  } catch (error) {
    return error.message;
  }
}

const test2 = amount => {
  try {
    const locale = {
      locale: 'en-UK'
    };
    const currency = 'USD';
    const formatter = MoneyFormatter(locale, currency, true);
    const moneyParts = formatter.format(amount);
    return JSON.stringify(moneyParts);
  } catch (error) {
    return error.message;
  }
};

const testWrapper = (amount, test) => h('div', [
  h('span', `${amount}: `),
  h('span', test(amount))
]);

const app = document.getElementById('app');
app.innerHTML = '';
document.getElementById('app').appendChild(
  h(
    'div', [
      testWrapper(35.87, test1),
      testWrapper(35.87, simpleFormatterTest),
      testWrapper('browser support', browserSupportTest),
      testWrapper(35.87, formatToPartsTest),
      testWrapper(35.87, test2),
    ]
  )
);
