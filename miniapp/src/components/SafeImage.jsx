import { useEffect, useState } from 'react';

/**
 * Rasm yuklanmasa (havola noto'g'ri yoki internet sekin bo'lsa),
 * uning o'rniga zaxira ko'rinish chiqadi.
 */
export default function SafeImage({ src, alt = '', className, fallbackClassName, fallback, ...rest }) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) {
    return <div className={fallbackClassName || className}>{fallback}</div>;
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
