import { MongoBinary } from 'mongodb-memory-server';

export default async function setup(): Promise<void> {
  await MongoBinary.getPath({ version: '7.0.0' });
}
