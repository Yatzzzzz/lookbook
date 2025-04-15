# API Documentation for Lookbook Application

This document provides detailed information about the API endpoints available in the Lookbook application.

## Base URL

For local development: `http://localhost:3000/api`
For production: `https://your-production-domain.com/api`

## Authentication Endpoints

### Sign Up

Register a new user account.

- **URL**: `/auth/signup`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "fashionista"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "user-uuid",
          "email": "user@example.com",
          "username": "fashionista"
        }
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Email already registered"
    }
    ```

### Login

Authenticate a user and create a session.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "session": {
          "access_token": "jwt-token",
          "user": {
            "id": "user-uuid",
            "email": "user@example.com",
            "username": "fashionista"
          }
        }
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Invalid login credentials"
    }
    ```

### OAuth Login

Authenticate a user using a third-party provider.

- **URL**: `/auth/oauth`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "provider": "google"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "url": "https://oauth-provider-url"
      }
    }
    ```

### Logout

End the current user session.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true
    }
    ```

## Look Management Endpoints

### Get Looks

Retrieve a list of looks with optional filtering.

- **URL**: `/looks`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional): Number of looks to return (default: 20)
  - `offset` (optional): Offset for pagination (default: 0)
  - `user_id` (optional): Filter by user ID
  - `style` (optional): Filter by style
  - `sort` (optional): Sort order (`recent`, `popular`, `trending`)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "looks": [
          {
            "look_id": "look-uuid",
            "user_id": "user-uuid",
            "image_url": "https://example.com/image.jpg",
            "description": "My summer outfit",
            "created_at": "2025-03-28T12:00:00Z",
            "ai_metadata": {
              "style": "Casual",
              "colors": ["Blue", "White"],
              "brands": ["Zara", "H&M"]
            },
            "rating": "GREAT"
          }
        ],
        "total": 100,
        "limit": 20,
        "offset": 0
      }
    }
    ```

### Create Look

Upload a new look.

- **URL**: `/looks`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "image": "base64-encoded-image",
    "description": "My summer outfit",
    "audience": {
      "include": ["everyone"],
      "exclude": []
    },
    "ai_metadata": {
      "style": "Casual",
      "colors": ["Blue", "White"],
      "brands": ["Zara", "H&M"]
    },
    "shoppable_items": [
      {
        "item_name": "Blue Denim Jacket",
        "category": "Outerwear",
        "brand": "Zara",
        "color": "Blue",
        "price": 89.99,
        "affiliate_link": "https://example.com/affiliate/jacket",
        "bounding_box": {
          "x": 100,
          "y": 50,
          "width": 200,
          "height": 300
        }
      }
    ]
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "look_id": "look-uuid",
        "image_url": "https://example.com/image.jpg"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Invalid image format"
    }
    ```

### Get Look Details

Retrieve details for a specific look.

- **URL**: `/looks/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Look ID
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "look": {
          "look_id": "look-uuid",
          "user_id": "user-uuid",
          "image_url": "https://example.com/image.jpg",
          "description": "My summer outfit",
          "created_at": "2025-03-28T12:00:00Z",
          "ai_metadata": {
            "style": "Casual",
            "colors": ["Blue", "White"],
            "brands": ["Zara", "H&M"],
            "bounding_boxes": [
              {
                "x": 100,
                "y": 50,
                "width": 200,
                "height": 300,
                "item_name": "Blue Denim Jacket",
                "brand": "Zara"
              }
            ]
          },
          "rating": "GREAT",
          "shoppable_items": [
            {
              "item_id": "item-uuid",
              "item_name": "Blue Denim Jacket",
              "category": "Outerwear",
              "brand": "Zara",
              "color": "Blue",
              "price": 89.99,
              "affiliate_link": "https://example.com/affiliate/jacket",
              "bounding_box": {
                "x": 100,
                "y": 50,
                "width": 200,
                "height": 300
              }
            }
          ],
          "user": {
            "username": "fashionista",
            "profile_picture": "https://example.com/profile.jpg"
          }
        }
      }
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Look not found"
    }
    ```

### Update Look

Update an existing look.

- **URL**: `/looks/:id`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: Look ID
- **Request Body**:
  ```json
  {
    "description": "Updated description",
    "audience": {
      "include": ["friends"],
      "exclude": []
    }
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "look_id": "look-uuid"
      }
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Look not found"
    }
    ```

### Delete Look

Delete a look.

- **URL**: `/looks/:id`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: Look ID
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Look not found"
    }
    ```

### Rate Look

Submit or update a rating for a look.

- **URL**: `/looks/:id/rate`
- **Method**: `POST`
- **URL Parameters**:
  - `id`: Look ID
- **Request Body**:
  ```json
  {
    "rating": "AMAZING"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "rating": "AMAZING"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Invalid rating value"
    }
    ```

## Gallery Endpoints

### Vote on Battle

Submit a vote in a fashion battle.

- **URL**: `/gallery/vote`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "session_id": "session-uuid",
    "look_id": "look-uuid",
    "vote_value": "winner"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "vote_id": "vote-uuid"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Invalid vote value"
    }
    ```

## Search Endpoints

### Search Looks

Search for looks based on various criteria.

- **URL**: `/search`
- **Method**: `GET`
- **Query Parameters**:
  - `q` (optional): Search query
  - `style` (optional): Filter by style
  - `colors` (optional): Filter by colors (comma-separated)
  - `brands` (optional): Filter by brands (comma-separated)
  - `limit` (optional): Number of results to return (default: 20)
  - `offset` (optional): Offset for pagination (default: 0)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "looks": [
          {
            "look_id": "look-uuid",
            "user_id": "user-uuid",
            "image_url": "https://example.com/image.jpg",
            "description": "Blue denim outfit",
            "ai_metadata": {
              "style": "Casual",
              "colors": ["Blue", "White"],
              "brands": ["Zara", "H&M"]
            }
          }
        ],
        "total": 50,
        "limit": 20,
        "offset": 0
      }
    }
    ```

## AI Endpoints

### Analyze Image

Analyze a fashion image using AI.

- **URL**: `/ai/analyze`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "image": "base64-encoded-image"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "items": [
          {
            "item_name": "Blue Denim Jacket",
            "category": "Outerwear",
            "brand": "Zara",
            "color": "Blue",
            "bounding_box": {
              "x": 100,
              "y": 50,
              "width": 200,
              "height": 300
            }
          }
        ],
        "style": "Casual",
        "colors": ["Blue", "White"],
        "brands": ["Zara", "H&M"],
        "occasion_suitability": ["Casual outing", "Weekend"],
        "season": "Spring"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Failed to analyze image"
    }
    ```

### Chat with AI

Get fashion advice from the AI chatbot.

- **URL**: `/ai/chat`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "message": "What should I wear to a summer wedding?",
    "image": "base64-encoded-image", // Optional
    "chat_id": "chat-uuid" // Optional, for continuing a conversation
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "chat_id": "chat-uuid",
        "answer": "For a summer wedding, I'd recommend a light-colored suit or a floral dress depending on your style...",
        "suggestions": {
          "items": [
            {
              "item_name": "Floral Maxi Dress",
              "affiliate_link": "https://example.com/affiliate/dress",
              "price": 129.99,
              "brand": "Zara"
            }
          ],
          "actions": [
            "Consider the venue when choosing shoes",
            "Bring a light jacket for evening"
          ]
        }
      }
    }
    ```
- **Error Response**:
  - **Code**: 500
  - **Content**:
    ```json
    {
      "success": false,
      "error": "AI service unavailable"
    }
    ```

## User Endpoints

### Get User Profile

Retrieve a user's profile information.

- **URL**: `/users/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: User ID
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "user_id": "user-uuid",
          "username": "fashionista",
          "name": "Fashion Expert",
          "profile_picture": "https://example.com/profile.jpg",
          "ranking_badge": "Fashion Influencer",
          "created_at": "2025-01-15T10:30:00Z",
          "stats": {
            "total_looks": 45,
            "total_followers": 230,
            "average_rating": 4.2
          }
        }
      }
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "success": false,
      "error": "User not found"
    }
    ```

### Get User's Saved Looks

Retrieve a user's saved looks.

- **URL**: `/users/:id/saved-looks`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: User ID
- **Query Parameters**:
  - `limit` (optional): Number of looks to return (default: 20)
  - `offset` (optional): Offset for pagination (default: 0)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "looks": [
          {
            "look_id": "look-uuid",
            "user_id": "user-uuid",
            "image_url": "https://example.com/image.jpg",
            "description": "My summer outfit",
            "created_at": "2025-03-28T12:00:00Z",
            "ai_metadata": {
              "style": "Casual",
              "colors": ["Blue", "White"],
              "brands": ["Zara", "H&M"]
            }
          }
        ],
        "total": 15,
        "limit": 20,
        "offset": 0
      }
    }
    ```

## Wardrobe Endpoints

### Get Wardrobe Items

Retrieve a user's wardrobe items.

- **URL**: `/wardrobe`
- **Method**: `GET`
- **Query Parameters**:
  - `category` (optional): Filter by category
  - `limit` (optional): Number of items to return (default: 20)
  - `offset` (optional): Offset for pagination (default: 0)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "items": [
          {
            "item_id": "item-uuid",
            "category": "Outerwear",
            "color": "Blue",
            "image_path": "https://example.com/wardrobe/jacket.jpg",
            "brand": "Zara",
            "style": "Casual",
            "created_at": "2025-02-10T15:20:00Z"
          }
        ],
        "total": 35,
        "limit": 20,
        "offset": 0
      }
    }
    ```

### Add Wardrobe Item

Add a new item to the user's wardrobe.

- **URL**: `/wardrobe`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "category": "Outerwear",
    "color": "Blue",
    "image": "base64-encoded-image",
    "brand": "Zara",
    "style": "Casual",
    "metadata": {
      "size": "M",
      "material": "Denim",
      "season": "Spring"
    }
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "item_id": "item-uuid",
        "image_path": "https://example.com/wardrobe/jacket.jpg"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Invalid image format"
    }
    ```

## Trends Endpoints

### Get Rising Trends

Retrieve current rising fashion trends.

- **URL**: `/trends/rising`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "trends": [
          {
            "trend_id": "trend-uuid",
            "name": "Y2K Revival",
            "description": "The return of early 2000s fashion with low-rise jeans, baby tees, and butterfly clips.",
            "image_url": "https://example.com/trends/y2k.jpg",
            "created_at": "2025-03-15T09:00:00Z"
          }
        ]
      }
    }
    ```

## Viral Prediction Endpoints

### Get Viral Prediction

Get a prediction of how viral a look might become.

- **URL**: `/look/viral-prediction`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "look_id": "look-uuid"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "viral_score": 85.7,
        "prediction": "This look has high viral potential",
        "factors": [
          "Trending color combination",
          "Popular style category",
          "High engagement rate"
        ]
      }
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "success": false,
      "error": "Look not found"
    }
    ```

## Stylist Reminder Endpoints

### Get Stylist Reminders

Get personalized stylist reminders.

- **URL**: `/lookbook/stylist-reminder`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "reminders": [
          {
            "reminder_id": "reminder-uuid",
            "title": "Update your summer wardrobe",
            "description": "Summer is approaching! Time to refresh your wardrobe with these trending items.",
            "created_at": "2025-03-28T12:00:00Z",
            "suggested_items": [
              {
                "item_name": "Linen Shirt",
                "category": "Tops",
                "affiliate_link": "https://example.com/affiliate/linen-shirt"
              }
            ]
          }
        ]
      }
    }
    ```

## Ranking Endpoints

### Update User Badge

Update a user's ranking badge.

- **URL**: `/ranking/update-badge`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_id": "user-uuid"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "previous_badge": "Fashion Novice",
        "new_badge": "Fashion Influencer",
        "ranking_score": 750
      }
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "success": false,
      "error": "User not found"
    }
    ```

## Error Codes

- `400`: Bad Request - The request was malformed or contained invalid parameters
- `401`: Unauthorized - Authentication is required or has failed
- `403`: Forbidden - The authenticated user does not have permission to access the requested resource
- `404`: Not Found - The requested resource was not found
- `500`: Internal Server Error - An unexpected error occurred on the server

## Rate Limiting

API requests are limited to 100 requests per minute per user. If you exceed this limit, you will receive a `429 Too Many Requests` response.

## Versioning

The current API version is v1. All endpoints should be prefixed with `/api/v1` for future compatibility.
