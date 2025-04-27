'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import { WardrobeItem } from '@/app/context/WardrobeContext';

interface CanvasItem extends WardrobeItem {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  isDragging: boolean;
  zIndex: number;
}

interface OutfitCanvasProps {
  items: WardrobeItem[];
  onChange?: (items: CanvasItem[]) => void;
  onSelect?: (item: CanvasItem | null) => void;
  width?: number;
  height?: number;
  editable?: boolean;
}

interface TransformableImageProps {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  editable: boolean;
}

// Component for each draggable/transformable image
const TransformableImage: React.FC<TransformableImageProps> = ({ 
  item, 
  isSelected, 
  onSelect, 
  onChange,
  editable
}) => {
  const [image] = useImage(item.image_path || '');
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current) {
      // Attach transformer to the image
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        draggable={editable}
        x={item.x}
        y={item.y}
        rotation={item.rotation}
        ref={imageRef}
        onDragStart={() => {
          onChange({
            ...item,
            isDragging: true,
          });
        }}
        onDragEnd={(e) => {
          onChange({
            ...item,
            isDragging: false,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // Transformer changes scale, we need to adjust it
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation();

          onChange({
            ...item,
            x: node.x(),
            y: node.y(),
            rotation,
            scaleX,
            scaleY,
            width: Math.max(5, item.width * scaleX),
            height: Math.max(5, item.height * scaleY),
          });
        }}
        onClick={onSelect}
        onTap={onSelect}
      >
        <Image
          image={image}
          width={item.width}
          height={item.height}
          scaleX={item.scaleX}
          scaleY={item.scaleY}
        />
      </Group>
      {isSelected && editable && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotationSnaps={[0, 90, 180, 270]}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  );
};

export function OutfitCanvas({ 
  items = [], 
  onChange, 
  onSelect, 
  width = 600, 
  height = 600,
  editable = true
}: OutfitCanvasProps) {
  // Convert wardrobe items to canvas items
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(() => 
    items.map((item, index) => ({
      ...item,
      x: 150 + index * 30,
      y: 150 + index * 30,
      width: 150,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      isDragging: false,
      zIndex: index + 1
    }))
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Update canvas items when input items change
  useEffect(() => {
    if (items.length !== canvasItems.length) {
      // Only add new items, don't reset existing positions
      const existingItemIds = canvasItems.map(item => item.item_id);
      const newItems = items
        .filter(item => !existingItemIds.includes(item.item_id))
        .map((item, index) => ({
          ...item,
          x: 150 + (canvasItems.length + index) * 30,
          y: 150 + (canvasItems.length + index) * 30,
          width: 150,
          height: 200,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          isDragging: false,
          zIndex: canvasItems.length + index + 1
        }));
      
      setCanvasItems([...canvasItems, ...newItems]);
    }
  }, [items]);

  // Handle item selection
  const handleSelect = (item: CanvasItem) => {
    setSelectedId(item.item_id);
    if (onSelect) {
      onSelect(item);
    }
  };

  // Handle stage click to deselect
  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
      if (onSelect) {
        onSelect(null);
      }
    }
  };

  // Handle item attributes change
  const handleItemChange = (updatedItem: CanvasItem) => {
    const updatedItems = canvasItems.map(item => 
      item.item_id === updatedItem.item_id ? updatedItem : item
    );
    
    setCanvasItems(updatedItems);
    
    if (onChange) {
      onChange(updatedItems);
    }
  };

  // Bring selected item to front
  const bringToFront = () => {
    if (!selectedId) return;
    
    const selectedItem = canvasItems.find(item => item.item_id === selectedId);
    if (!selectedItem) return;
    
    // Calculate highest zIndex
    const highestZIndex = Math.max(...canvasItems.map(item => item.zIndex)) + 1;
    
    // Update selected item's zIndex
    const updatedItems = canvasItems.map(item => 
      item.item_id === selectedId 
        ? { ...item, zIndex: highestZIndex } 
        : item
    );
    
    setCanvasItems(updatedItems);
    
    if (onChange) {
      onChange(updatedItems);
    }
  };
  
  // Send selected item to back
  const sendToBack = () => {
    if (!selectedId) return;
    
    const selectedItem = canvasItems.find(item => item.item_id === selectedId);
    if (!selectedItem) return;
    
    // Calculate lowest zIndex
    const lowestZIndex = Math.min(...canvasItems.map(item => item.zIndex)) - 1;
    
    // Update selected item's zIndex
    const updatedItems = canvasItems.map(item => 
      item.item_id === selectedId 
        ? { ...item, zIndex: lowestZIndex } 
        : item
    );
    
    setCanvasItems(updatedItems);
    
    if (onChange) {
      onChange(updatedItems);
    }
  };

  // Sort items by zIndex for proper layering
  const sortedItems = [...canvasItems].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="overflow-hidden">
      {editable && (
        <div className="flex mb-4 space-x-2">
          <button
            className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            onClick={bringToFront}
            disabled={!selectedId}
          >
            Bring to Front
          </button>
          <button
            className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            onClick={sendToBack}
            disabled={!selectedId}
          >
            Send to Back
          </button>
        </div>
      )}
      <div 
        className="border border-gray-300 rounded-md overflow-hidden" 
        style={{ width, height }}
      >
        <Stage
          width={width}
          height={height}
          onMouseDown={handleStageClick}
          onTouchStart={handleStageClick}
        >
          <Layer>
            {sortedItems.map((item) => (
              <TransformableImage
                key={item.item_id}
                item={item}
                isSelected={item.item_id === selectedId}
                onSelect={() => handleSelect(item)}
                onChange={(newAttrs) => handleItemChange({ ...item, ...newAttrs })}
                editable={editable}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
} 