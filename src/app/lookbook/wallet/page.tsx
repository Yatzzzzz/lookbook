"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  name: string;
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [activeTab, setActiveTab] = useState<'summary' | 'payment-methods' | 'transactions'>('summary');
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFundsModal, setShowAddFundsModal] = useState<boolean>(false);
  const [fundAmount, setFundAmount] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchWalletData();
  }, [user, router]);

  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would fetch from Supabase tables
      // Mock data for now
      setTimeout(() => {
        setBalance(540.75);
        setTransactions([
          {
            id: '1',
            type: 'credit',
            amount: 100,
            description: 'Added funds',
            date: '2023-04-10T14:48:00.000Z',
          },
          {
            id: '2',
            type: 'debit',
            amount: 49.99,
            description: 'Purchase: Designer T-Shirt',
            date: '2023-04-08T10:23:00.000Z',
          },
          {
            id: '3',
            type: 'credit',
            amount: 50,
            description: 'Refund: Canceled order #ORD-13764',
            date: '2023-03-30T16:15:00.000Z',
          },
          {
            id: '4',
            type: 'debit',
            amount: 89.99,
            description: 'Purchase: Premium Jeans',
            date: '2023-03-25T19:37:00.000Z',
          },
          {
            id: '5',
            type: 'credit',
            amount: 500,
            description: 'Added funds',
            date: '2023-03-20T08:52:00.000Z',
          },
        ]);
        setPaymentMethods([
          {
            id: '1',
            type: 'card',
            name: 'Visa ending in 4242',
            last4: '4242',
            expiryDate: '12/25',
            isDefault: true,
          },
          {
            id: '2',
            type: 'paypal',
            name: 'PayPal',
            isDefault: false,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again.');
      setLoading(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would add funds through a payment processor
      // and update the balance in Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      const amount = Number(fundAmount);

      // Update balance
      setBalance(prevBalance => prevBalance + amount);

      // Add transaction
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'credit',
        amount: amount,
        description: 'Added funds',
        date: new Date().toISOString(),
      };
      setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);

      // Close modal and reset form
      setShowAddFundsModal(false);
      setFundAmount('');
    } catch (err) {
      console.error('Error adding funds:', err);
      setError('Failed to add funds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prevMethods =>
      prevMethods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(prevMethods =>
      prevMethods.filter(method => method.id !== id)
    );
  };

  if (!user) {
    return <div className="p-4 text-center">Redirecting to login...</div>;
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Your Wallet</h1>
      
      {error && (
        <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'summary'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'payment-methods'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('payment-methods')}
        >
          Payment Methods
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'transactions'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transaction History
        </button>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <p className="text-gray-500 mb-1">Current Balance</p>
                <h2 className="text-3xl font-bold">${balance.toFixed(2)}</h2>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={() => setShowAddFundsModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Funds
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between pb-3 border-b">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {transactions.length > 3 && (
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-blue-500 hover:underline text-sm mt-2"
                  >
                    View all transactions
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Your Payment Methods</h3>
            <button
              className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              Add New
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <p className="text-gray-500">No payment methods added.</p>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        {method.type === 'card' ? (
                          <svg
                            className="w-6 h-6 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        <span className="font-medium">{method.name}</span>
                        {method.isDefault && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      {method.type === 'card' && method.expiryDate && (
                        <p className="text-sm text-gray-500">Expires: {method.expiryDate}</p>
                      )}
                    </div>
                    <div className="flex">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          className="text-sm text-blue-500 hover:underline mr-3"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Transaction History</h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-right py-3 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-3 px-2 text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        {transaction.description}
                      </td>
                      <td
                        className={`py-3 px-2 text-right ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-white bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Funds to Wallet</h3>
              <button
                onClick={() => setShowAddFundsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddFunds}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="text"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={paymentMethods.find(m => m.isDefault)?.id || ''}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} {method.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddFundsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 