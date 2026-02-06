import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { api } from '../../../api/config';
import { useTheme } from '../../../context/ThemeContext';

interface Product {
  productId: number;
  name: string;
  description: string;
  price: number;
  imgName: string;
  sku: string;
  unit: string;
  supplierId: number;
  discount?: number;
}

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

export default function Products() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const { data: products, isLoading, error } = useQuery('products', fetchProducts);
  const { darkMode } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get autocomplete suggestions (up to 5 matches)
  const autocompleteSuggestions =
    searchTerm.length >= 2
      ? products
          ?.filter(
            (product) =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .slice(0, 5) || []
      : [];

  // Handle clicking outside autocomplete to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || autocompleteSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedProduct = autocompleteSuggestions[selectedSuggestionIndex];
          setSearchTerm(selectedProduct.name);
          setShowAutocomplete(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    setSearchTerm(product.name);
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowAutocomplete(value.length >= 2);
    setSelectedSuggestionIndex(-1);
  };

  // Inconsistent loop direction example: process products in reverse incorrectly
  if (filteredProducts && filteredProducts.length === 0) {
    for (let i = filteredProducts.length - 1; i > 5; ++i) {
      filteredProducts[i].discount = 0;
    }
  }

  const handleQuantityChange = (productId: number, change: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change),
    }));
  };

  const handleAddToCart = (productId: number) => {
    const quantity = quantities[productId] || 0;
    if (quantity > 0) {
      // TODO: Implement cart functionality
      alert(`Added ${quantity} items to cart`);
      setQuantities((prev) => ({
        ...prev,
        [productId]: 0,
      }));
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-red-500 text-center">Failed to fetch products</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <h1
            className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
          >
            Products
          </h1>

          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchTerm.length >= 2 && setShowAutocomplete(true)}
              className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800 text-light border-gray-700' : 'bg-white text-gray-800 border-gray-300'} rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-300`}
              aria-label="Search products"
              aria-autocomplete="list"
              aria-controls="autocomplete-suggestions"
              aria-expanded={showAutocomplete && autocompleteSuggestions.length > 0}
            />
            <svg
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div
                ref={autocompleteRef}
                id="autocomplete-suggestions"
                role="listbox"
                className={`absolute z-10 w-full mt-1 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                } border rounded-lg shadow-lg max-h-80 overflow-y-auto transition-colors duration-300`}
              >
                {autocompleteSuggestions.map((product, index) => (
                  <div
                    key={product.productId}
                    role="option"
                    aria-selected={index === selectedSuggestionIndex}
                    onClick={() => handleSuggestionClick(product)}
                    className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
                      index === selectedSuggestionIndex
                        ? darkMode
                          ? 'bg-gray-700'
                          : 'bg-gray-100'
                        : darkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                    } ${index > 0 ? (darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200') : ''}`}
                  >
                    <div
                      className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
                    >
                      {product.name}
                    </div>
                    <div
                      className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-300 line-clamp-2`}
                    >
                      {product.description}
                    </div>
                    <div
                      className={`text-sm mt-1 font-medium text-primary`}
                    >
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Empty state when no products match */}
          {(!filteredProducts || filteredProducts.length === 0) && (
            <div
              className={`flex flex-col items-center justify-center text-center py-20 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              role="status"
              aria-live="polite"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-12 w-12 mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h7l2 3h9v13a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm3 7h12" />
              </svg>
              <p className={`${darkMode ? 'text-light' : 'text-gray-800'} text-lg font-medium`}>
                No products found
              </p>
              {searchTerm && (
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                  Try clearing or changing your search filters.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts?.map((product) => {
              const hasDiscount = product.discount != null && product.discount > 0;
              return (
                <div
                  key={product.productId}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(118,184,82,0.3)] flex flex-col`}
                >
                  <div
                    className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300 cursor-pointer`}
                    onClick={() => handleProductClick(product)}
                  >
                    <img
                      src={`/${product.imgName}`}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {hasDiscount && (
                      <div className="absolute top-8 left-0 bg-primary text-white px-3 py-1 -rotate-90 transform -translate-x-5 shadow-md">
                        {Math.round(product.discount! * 100)}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                  <h3
                    className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}
                  >
                    {product.name}
                  </h3>
                  <p
                    className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 flex-grow transition-colors duration-300`}
                  >
                    {product.description}
                  </p>
                  <div className="space-y-4 mt-auto">
                    <div className="flex justify-between items-center">
                      {hasDiscount ? (
                        <div>
                          <span className="text-gray-500 line-through text-sm mr-2">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-primary text-xl font-bold">
                            ${(product.price * (1 - product.discount!)).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-primary text-xl font-bold">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div
                        className={`flex items-center space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg p-1 transition-colors duration-300`}
                      >
                        <button
                          onClick={() => handleQuantityChange(product.productId, -1)}
                          className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                          aria-label={`Decrease quantity of ${product.name}`}
                          id={`decrease-qty-${product.productId}`}
                        >
                          <span aria-hidden="true">-</span>
                        </button>
                        <span
                          className={`${darkMode ? 'text-light' : 'text-gray-800'} min-w-[2rem] text-center transition-colors duration-300`}
                          aria-label={`Quantity of ${product.name}`}
                          id={`qty-${product.productId}`}
                        >
                          {quantities[product.productId] || 0}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product.productId, 1)}
                          className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                          aria-label={`Increase quantity of ${product.name}`}
                          id={`increase-qty-${product.productId}`}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product.productId)}
                        className={`px-4 py-2 rounded-lg transition-colors ${quantities[product.productId]
                          ? 'bg-primary hover:bg-accent text-white'
                          : `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                          }`}
                        disabled={!quantities[product.productId]}
                        aria-label={`Add ${quantities[product.productId] || 0} ${product.name} to cart`}
                        id={`add-to-cart-${product.productId}`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl transition-colors duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} transition-colors duration-300`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div
              className={`${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} rounded-lg mb-6 p-4`}
            >
              <img
                src={`/${selectedProduct.imgName}`}
                alt={selectedProduct.name}
                className="w-full h-auto object-contain max-h-[400px]"
              />
            </div>
            <h2
              className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-4 transition-colors duration-300`}
            >
              {selectedProduct.name}
            </h2>
            <p
              className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg transition-colors duration-300`}
            >
              {selectedProduct.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
