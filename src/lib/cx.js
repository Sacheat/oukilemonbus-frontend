// Concatène des classes en ignorant les valeurs falsy : cx('a', cond && 'b')
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}
