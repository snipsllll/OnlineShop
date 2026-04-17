import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  /**
   * Konvertiert eine Bilddatei in eine komprimierte Base64-Data-URL.
   * Maximale Breite/Höhe: 1200px, JPEG-Qualität: 0.8
   */
  imageToBase64(file: File, maxSize = 1200, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let {width, height} = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
