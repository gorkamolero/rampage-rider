/**
 * CircularBuffer - O(1) push with automatic size limiting
 *
 * Unlike arrays with push/shift (O(n) shift), this uses index-based
 * circular access for constant-time operations.
 */
export class CircularBuffer {
  private buffer: Float64Array;
  private head: number = 0;
  private count: number = 0;
  readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Float64Array(capacity);
  }

  push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  get length(): number {
    return this.count;
  }

  /** Get sum of all values - O(n) but no allocations */
  sum(): number {
    let total = 0;
    for (let i = 0; i < this.count; i++) {
      total += this.buffer[i];
    }
    return total;
  }

  /** Get average of all values */
  average(): number {
    return this.count > 0 ? this.sum() / this.count : 0;
  }

  /** Clear buffer */
  clear(): void {
    this.head = 0;
    this.count = 0;
  }
}
