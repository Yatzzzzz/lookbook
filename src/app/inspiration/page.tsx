'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWardrobe } from '../context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, TrashIcon, LockClosedIcon, LockOpen1Icon, Pencil2Icon } from '@radix-ui/react-icons';
import Image from 'next/image';

export default function InspirationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    inspirationBoards, 
    isLoadingInspirationBoards, 
    inspirationBoardError,
    createInspirationBoard,
    deleteInspirationBoard,
    updateInspirationBoard,
    refreshInspirationBoards
  } = useWardrobe();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [boardVisibility, setBoardVisibility] = useState('private');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Initialize the edit modal with the selected board's details
  const handleEditClick = (boardId: string) => {
    const board = inspirationBoards.find(b => b.id === boardId);
    if (board) {
      setSelectedBoard(boardId);
      setBoardName(board.name);
      setBoardDescription(board.description || '');
      setBoardVisibility(board.visibility || 'private');
      setIsEditModalOpen(true);
    }
  };

  // Handle the board creation
  const handleCreateBoard = async () => {
    try {
      const boardId = await createInspirationBoard(
        boardName,
        boardDescription,
        boardVisibility
      );
      
      // Reset the form
      setBoardName('');
      setBoardDescription('');
      setBoardVisibility('private');
      setIsCreateModalOpen(false);
      
      // Navigate to the new board
      router.push(`/inspiration/${boardId}`);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  // Handle the board update
  const handleUpdateBoard = async () => {
    if (!selectedBoard) return;
    
    try {
      await updateInspirationBoard(selectedBoard, {
        name: boardName,
        description: boardDescription,
        visibility: boardVisibility
      });
      
      // Reset the form
      setSelectedBoard(null);
      setBoardName('');
      setBoardDescription('');
      setBoardVisibility('private');
      setIsEditModalOpen(false);
      
      // Refresh the boards
      await refreshInspirationBoards();
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  // Handle the board deletion
  const handleDeleteBoard = async () => {
    if (!selectedBoard) return;
    
    try {
      await deleteInspirationBoard(selectedBoard);
      
      // Reset the selected board
      setSelectedBoard(null);
      setIsDeleteModalOpen(false);
      
      // Refresh the boards
      await refreshInspirationBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  // Toggle the board visibility
  const toggleVisibility = async (boardId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    
    try {
      await updateInspirationBoard(boardId, { visibility: newVisibility });
      await refreshInspirationBoards();
    } catch (error) {
      console.error('Error updating board visibility:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Inspiration Boards</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Board
        </button>
      </div>

      {isLoadingInspirationBoards ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : inspirationBoardError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">Error loading inspiration boards: {inspirationBoardError}</span>
        </div>
      ) : inspirationBoards.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">You don't have any inspiration boards yet.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Create Your First Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {inspirationBoards.map((board) => (
            <div
              key={board.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="h-40 bg-gray-100 relative cursor-pointer"
                onClick={() => router.push(`/inspiration/${board.id}`)}
              >
                {board.cover_image ? (
                  <Image
                    src={board.cover_image}
                    alt={board.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <span className="text-gray-400">No cover image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 
                    className="font-semibold text-lg truncate cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/inspiration/${board.id}`)}
                  >
                    {board.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleVisibility(board.id, board.visibility || 'private')}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={board.visibility === 'public' ? 'Make private' : 'Make public'}
                      title={board.visibility === 'public' ? 'Make private' : 'Make public'}
                    >
                      {board.visibility === 'public' ? (
                        <LockOpen1Icon className="w-4 h-4" />
                      ) : (
                        <LockClosedIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditClick(board.id)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Edit board"
                      title="Edit board"
                    >
                      <Pencil2Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBoard(board.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-gray-500 hover:text-red-600"
                      aria-label="Delete board"
                      title="Delete board"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {board.description && (
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{board.description}</p>
                )}
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="mr-2">
                    {board.visibility === 'public' ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Inspiration Board</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Board Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="My Fashion Inspiration"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="What's this board about?"
                rows={3}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visibility
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={boardVisibility === 'private'}
                    onChange={() => setBoardVisibility('private')}
                    className="mr-2"
                  />
                  Private
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={boardVisibility === 'public'}
                    onChange={() => setBoardVisibility('public')}
                    className="mr-2"
                  />
                  Public
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBoardName('');
                  setBoardDescription('');
                  setBoardVisibility('private');
                  setIsCreateModalOpen(false);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={!boardName.trim()}
                className={`px-4 py-2 rounded-md text-white ${
                  boardName.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Inspiration Board</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Board Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visibility
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={boardVisibility === 'private'}
                    onChange={() => setBoardVisibility('private')}
                    className="mr-2"
                  />
                  Private
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={boardVisibility === 'public'}
                    onChange={() => setBoardVisibility('public')}
                    className="mr-2"
                  />
                  Public
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedBoard(null);
                  setBoardName('');
                  setBoardDescription('');
                  setBoardVisibility('private');
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBoard}
                disabled={!boardName.trim()}
                className={`px-4 py-2 rounded-md text-white ${
                  boardName.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Delete Inspiration Board</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this inspiration board? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedBoard(null);
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 