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

const app = document.getElementById('app');

app.innerHTML = '';

const Money = (amount) => h('div', [
  h('span', `${amount}: `),
  h('span', JSON.stringify(Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'USD',
  }).formatToParts(amount)))
]);

document.getElementById('app').appendChild(
  h(
    'div', [
      Money(35.87)
    ]
  )
);
