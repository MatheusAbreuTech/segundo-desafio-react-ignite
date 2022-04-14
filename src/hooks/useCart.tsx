import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      //verificando se o produto existe no carrinho
      const productExist = updatedCart.find(
        (product) => product.id === productId
      );

      //pegando o produto no stock
      const stock = await api.get(`stock/${productId}`);

      //quantidade no stock do produto desejado
      const stockAmount = stock.data.amount;

      //quantidade atual do produto no carrinho
      const currentAmount = productExist ? productExist.amount : 0;

      //quantidade desejada
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExist) {
        //passando a quantidade desejada caso o produto já exista no carrinho
        productExist.amount = amount;
      } else {
        //pegando as infos do produto desejado
        const product = await api.get(`products/${productId}`);

        //pegando o produto e adicionando uma unidade
        const newProduct = {
          ...product.data,
          amount: 1,
        };

        //atualizando o array de carrinho passando o novo produto
        updatedCart.push(newProduct);
      }

      //atualizando o carrinho com as novas informações
      setCart(updatedCart);

      //adicionando no localstorage as novas infos do carrinho
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(
        (product) => product.id === productId
      );

      console.log(productIndex);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      //pegando o produto no stock
      const stock = await api.get(`stock/${productId}`);

      //quantidade no stock do produto desejado
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];

      const productExist = updatedCart.find(
        (product) => product.id === productId
      );

      if (productExist) {
        productExist.amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
