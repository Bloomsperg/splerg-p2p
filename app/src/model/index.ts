export interface Order {
  maker: string;
  taker: string;
  maker_token_mint: string;
  taker_token_mint: string;
  maker_amount: number;
  taker_amount: number;
}

export interface OrderTableProps {
  orders?: Order[];
}
