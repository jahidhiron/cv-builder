/** Shape of the file object produced by Multer's NestJS `FileInterceptor`. */
export interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
  fieldname: string;
  encoding: string;
}
