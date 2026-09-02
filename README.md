# Instagram Follower Insights

A full-stack web application that allows users to upload their Instagram data export (`followers_1.json` and `following.json` or a `.zip` archive) and interactively inspect:
- **Unfollowers**: Accounts that were following you in the previous upload session but no longer follow you.
- **Non-Followers Back**: Accounts you follow that do not follow you back.
- **New Followers**: Accounts that started following you since your previous upload.
- **Fans**: Accounts that follow you, but you don't follow back.
- **Mutuals**: Accounts where both parties follow each other.
- **Session Comparisons**: Compare any two upload sessions across time.

---

## 🚀 Quick Start with Docker Compose

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)

### 1. Production Mode
Run the complete stack (PostgreSQL, Express Backend on port 5034, and Nginx-served React Frontend on port 80):

```bash
docker-compose up --build -d
```

- **Frontend Application**: Open [http://localhost:80](http://localhost:80) or [http://localhost](http://localhost)
- **Backend API**: [http://localhost:5034/api/health](http://localhost:5034/api/health)
- **PostgreSQL Database**: Accessible on port `5432` (`postgres:postgres@localhost:5432/instagram_insights`)

To stop the containers:
```bash
docker-compose down
```
To stop and delete persistent database volumes:
```bash
docker-compose down -v
```

### 2. Development Mode (with Hot-Reloading)
Run with volume-mounted source code and auto-reload:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

## 📥 How to Obtain Your Instagram Data Export

Instagram allows you to download an official archive of your account data directly from the Meta Accounts Center:

1. **Open Instagram**:
   - On Desktop: Go to [Instagram.com](https://www.instagram.com) -> Click **More** (bottom left) -> **Settings** -> **Accounts Center**.
   - On Mobile: Profile -> Menu (top right) -> **Accounts Center**.
2. **Navigate to Download Data**:
   - Select **Your information and permissions**.
   - Click on **Download your information**.
   - Click **Request a download**.
3. **Select Information Type**:
   - Choose **Select types of information**.
   - Scroll down to find and check **Followers and following**.
4. **Choose Export Format (IMPORTANT)**:
   - Date range: **All time**.
   - Format: **JSON** (do *not* select HTML).
   - Media quality: Medium or Low (faster export).
5. **Download & Upload**:
   - Instagram will email you a download link when ready (often within a few minutes to hours).
   - Download the `.zip` file.
   - You can upload the entire `.zip` directly into this application, OR extract it and upload `followers_1.json` and `following.json`.

---

## 📄 Expected JSON Structure

Instagram exports followers and following inside the `connections/followers_and_following/` directory.

### 1. `followers_1.json`
An array of user relationship objects:
```json
[
  {
    "title": "",
    "media_list_data": [],
    "string_list_data": [
      {
        "href": "https://www.instagram.com/johndoe",
        "value": "johndoe",
        "timestamp": 1698754200
      }
    ]
  },
  {
    "title": "",
    "media_list_data": [],
    "string_list_data": [
      {
        "href": "https://www.instagram.com/sarah_travels",
        "value": "sarah_travels",
        "timestamp": 1698754350
      }
    ]
  }
]
```

Or wrapped format:
```json
{
  "relationships_followers": [
    {
      "title": "johndoe",
      "string_list_data": [
        {
          "href": "https://www.instagram.com/johndoe",
          "value": "johndoe",
          "timestamp": 1698754200
        }
      ]
    }
  ]
}
```

### 2. `following.json`
An object with a `relationships_following` array:
```json
{
  "relationships_following": [
    {
      "title": "janedoe",
      "media_list_data": [],
      "string_list_data": [
        {
          "href": "https://www.instagram.com/janedoe",
          "value": "janedoe",
          "timestamp": 1698754200
        }
      ]
    }
  ]
}
```

*Note: The parser automatically handles both root arrays, object wrappers, nested `string_list_data`, and optional `profile_pic_url` fields.*

---

## 🔌 API Documentation

Base URL: `/api`

### 1. `POST /api/upload`
Uploads and parses an Instagram data export.
- **Request Type**: `multipart/form-data`
- **Fields**:
  - `followers`: `followers_1.json` (File)
  - `following`: `following.json` (File)
  - *OR* `archive`: Export archive `.zip` (File)
  - `label`: Optional session label (String, e.g. "September 2026 Export")
- **File Limit**: 10 MB.
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Instagram export uploaded and processed successfully.",
    "uploadId": 1,
    "followersCount": 1250,
    "followingCount": 980,
    "label": "September 2026 Export",
    "uploadedAt": "2026-09-02T16:00:00.000Z"
  }
  ```

### 2. `GET /api/dashboard/:uploadId`
Retrieves comparison statistics and user lists.
- **Path Parameter**: `uploadId` (integer)
- **Query Parameter**: `?compareWithId=:id` (optional, compares against a specific previous upload instead of the latest previous one).
- **Response**: `200 OK`
  ```json
  {
    "currentUpload": {
      "id": 2,
      "uploaded_at": "2026-09-02T16:00:00.000Z",
      "label": "Current - Today",
      "followers_count": 1240,
      "following_count": 985
    },
    "previousUpload": {
      "id": 1,
      "uploaded_at": "2026-08-01T12:00:00.000Z",
      "label": "Baseline - Last Month",
      "followers_count": 1250,
      "following_count": 980
    },
    "totalFollowers": 1240,
    "totalFollowing": 985,
    "unfollowersCount": 15,
    "nonFollowersBackCount": 210,
    "newFollowersCount": 5,
    "fansCount": 465,
    "mutualsCount": 775,
    "unfollowers": [
      {
        "username": "lost_user",
        "profile_url": "https://www.instagram.com/lost_user/",
        "profile_pic_url": null
      }
    ],
    "nonFollowersBack": [...],
    "newFollowers": [...],
    "fans": [...],
    "mutuals": [...]
  }
  ```

### 3. `GET /api/uploads`
Returns all recorded upload sessions ordered by upload date descending.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 2,
      "uploaded_at": "2026-09-02T16:00:00.000Z",
      "label": "Current - Today",
      "followers_count": 1240,
      "following_count": 985
    },
    {
      "id": 1,
      "uploaded_at": "2026-08-01T12:00:00.000Z",
      "label": "Baseline - Last Month",
      "followers_count": 1250,
      "following_count": 980
    }
  ]
  ```

### 4. `DELETE /api/uploads/:uploadId`
Deletes a specific upload session and its associated follower/following records.

### 5. `POST /api/demo`
Seeds sample demonstration sessions so users can test the dashboard immediately.

---

## 🛡️ Security & Architecture
- **SQL Injection Prevention**: Parameterized queries (`$1, $2`, etc.) are used for all database transactions via `pg`.
- **File Sanitization**: Uploaded filenames are sanitized and validated against allowed extensions and MIME types.
- **Relational Integrity**: Foreign keys with `ON DELETE CASCADE` ensure clean data removal when sessions are deleted.
- **Indexes**: Indexed columns on `upload_id` and `username` ensure high performance when querying large follower graphs.
