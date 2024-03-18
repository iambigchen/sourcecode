const hyphenateRE = /\B([A-Z])/g
const hyphenate = (str) => {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
}


function hasChanged(x, y) {
    if (x === y) {
      return x === 0 && 1 / x !== 1 / y
    } else {
      return x === x || y === y
    }
}
