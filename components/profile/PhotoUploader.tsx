import React, { useState, ChangeEvent, DragEvent } from 'react';

interface Photo {
  id: string;
  url: string;
  file?: File; // Arquivo original para upload
}

interface PhotoUploaderProps {
  initialPhotos?: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  initialPhotos = [],
  onPhotosChange,
  maxPhotos = 9,
}) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      addFiles(filesArray);
    }
  };

  const addFiles = (filesToAdd: File[]) => {
    const newPhotos: Photo[] = filesToAdd
      .filter(file => file.type.startsWith('image/'))
      .slice(0, maxPhotos - photos.length) // Respeita o limite máximo
      .map(file => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      }));

    if (newPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    }
  };

  const handleRemovePhoto = (idToRemove: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== idToRemove);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
    // Limpar Object URL para liberar memória, se necessário
    const photoToRemove = photos.find(p => p.id === idToRemove);
    if (photoToRemove && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const filesArray = Array.from(event.dataTransfer.files);
      addFiles(filesArray);
      event.dataTransfer.clearData();
    }
  };

  // TODO: Implementar reordenação com drag and drop para as fotos

  return (
    <div className="photo-uploader">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    ${dragging ? 'border-neon-blue bg-gray-700' : 'border-gray-600 hover:border-gray-500'}`}
        onClick={() => document.getElementById('photo-upload-input')?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="photo-upload-input"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={photos.length >= maxPhotos}
        />
        {photos.length < maxPhotos ? (
          <p className="text-gray-400">
            Arraste e solte as fotos aqui, ou clique para selecionar. (Máx: {maxPhotos})
          </p>
        ) : (
          <p className="text-gray-500">Limite de {maxPhotos} fotos atingido.</p>
        )}
      </div>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt={`Upload preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
              />
              <button
                onClick={() => handleRemovePhoto(photo.id)}
                className="absolute top-1 right-1 bg-red-500/70 text-white rounded-full p-1 text-xs
                           opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover foto"
              >
                ✕
              </button>
              {/* Adicionar indicador de foto principal e funcionalidade de reordenar */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
