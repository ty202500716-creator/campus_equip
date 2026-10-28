import { useState } from 'react'

// Shows the equipment photo (public/assets/images/...), or a letter tile if there is no photo.
export default function EquipmentImage({ item, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!item.image_url || failed) {
    return (
      <div className={`eq-img eq-img--empty ${className}`} aria-hidden="true">
        {(item.name || '?').charAt(0)}
      </div>
    )
  }
  return (
    <img
      className={`eq-img ${className}`}
      src={encodeURI(item.image_url)}
      alt={item.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}