/* Dillselectors
*  https://luisafk.repl.co/projects/dillselectors-lib/lib.js
*/



let dillselectorGlobalOptions = {
  nodeIterator: true,
  nodeIteratorFilter: NodeFilter.SHOW_ELEMENT,
  nodeIteratorRoot: document.body || document.documentElement,
  debug: true,
  debugFunc: function() {
    if (this.debug) {
      console.debug(...arguments);
    }
  },
  pos: false,
  size: false,
  extendElementFunc(element) {
    const clone = element;//.cloneNode();

    clone._dillselector = {};

    if (this.pos || this.size) {
      const rect = clone.getBoundingClientRect();
      clone._dillselector.rect = rect;

      if (this.pos) {
        delete clone.pos;
        clone.dillpos = new DillselectorPos(rect);
      }

      if (this.size) {
        delete clone.size;
        clone.dillsize = new DillselectorSize(rect);
      }
    }

    return clone;
  }
};

class DillselectorPos {
  constructor(rect) {
    this.x = rect.x;
    this.y = rect.y;

    this.top = rect.top;
    this.left = rect.left;
    this.right = rect.right;
    this.bottom = rect.bottom;
  }
}

class DillselectorSize {
  constructor(rect) {
    this.width = rect.width;
    this.height = rect.height;
  }
}

class DillselectorIterator {
  constructor(value, isNodeIterator) {
    this._value = value;
    this._values = (typeof value[Symbol.iterator] == 'function')? 
      value[Symbol.iterator]() :
      null;
    this._isNodeIterator = isNodeIterator;
  }

  next() {
    if (this._isNodeIterator) {
      const next = this._value.nextNode();
  
      if (next) {
        return {
          done: false,
          value: next
        };
      }
  
      return {
        done: true,
        value: null
      };
    }

    return this._values.next();
  }

  [Symbol.iterator]() {
    return this;
  }
}

const dillselector = (selector, opts) => {
  if (typeof selector != 'function') {
    throw new TypeError('Selector must be a function (strings comming soon)');
  }

  opts = {
    ...dillselectorGlobalOptions,
    ...opts
  };
  const debug = opts.debugFunc;

  if (opts.nodeIterator) {
    const nodeIterator = document.createNodeIterator(
      opts.nodeIteratorRoot,
      opts.nodeIteratorFilter,
      {
        acceptNode: (element) => {
          return selector(opts.extendElementFunc(element))?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_SKIP;
        }
      }
    );

    return new DillselectorIterator(nodeIterator, true);
  } else {
    return new DillselectorIterator(
      opts.nodeIteratorRoot.getElementsByTagName('*')
    , false);
  }
};

const dillselectorPerformanceTest = (count = 1000) => {
  const resultsGood = [];
  const resultsBad = [];

  console.log('\nDoing', count, 'iterations');

  for (let i = 0; i < count; i++) {
    const startGood = performance.now();
    dillselector(() => true, { nodeIterator: true });
    resultsGood.push(performance.now() - startGood);

    const startBad = performance.now();
    dillselector(() => true, { nodeIterator: false });
    resultsBad.push(performance.now() - startBad);
  }

  console.log('Average good:',
    resultsGood.reduce((a, b) => a + b) / resultsGood.length
  );
  console.log('Highest good:', Math.max(...resultsGood));
  console.log('Lowest good:', Math.min(...resultsGood));

  console.log('');

  console.log('Average bad:',
    resultsBad.reduce((a, b) => a + b) / resultsBad.length
  );
  console.log('Highest bad:', Math.max(...resultsBad));
  console.log('Lowest bad:', Math.min(...resultsBad));
}