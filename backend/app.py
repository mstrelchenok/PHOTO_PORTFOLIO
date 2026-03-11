from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pymysql
import io
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024
CORS(app)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'photo_portfolio')
}

def get_db_connection():
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'photo_portfolio'),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            read_timeout=60,
            write_timeout=60
        )
        connection.ping(reconnect=True)
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        return None
    
def send_response(success, data = None, error = None):
    return jsonify({
        'success': success,
        'data': data,
        'error': error
    })

@app.route('/')
def index():
    return send_response(True, "Welcome to the Photo Portfolio API! The server is running successfully.")

# user registration
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    
    if not username or not password:
        return send_response(False, error = 'Please fill in username and password')
    
    connection = get_db_connection()
    if not connection :
        return send_response(False, error = 'Could not connect to the database')
    
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return send_response(False, error = 'This username already exists')
        
        cursor.execute("INSERT INTO users (username, password, full_name) VALUES (%s, %s, %s)", (username, password, full_name))
        connection.commit()

        user_id = cursor.lastrowid
        
        return send_response(True, {
            'user_id': user_id,
            'username': username,
            'full_name': full_name
        })

    except Exception as e :
        return send_response(False, error = f'Registration failed: {str(e)}')
    finally:
        cursor.close()
        connection.close()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return send_response(False, 'Please fill in username and password')
    
    connection = get_db_connection()
    if not connection :
        return send_response(False, 'Could not connect to the database')
    
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT user_id, username, full_name FROM users WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()
        
        if user:
            return send_response(True, user)
        else:
            return send_response(False, error = 'Invalid username or password')

    except Exception as e :
        return send_response(False, error = f'Login failed: {str(e)}')
    finally:
        cursor.close()
        connection.close()


@app.route('/api/upload', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return send_response(False, 'No photo uploaded')
    
    photo_file = request.files['photo']
    user_id = request.form.get('user_id')
    title = request.form.get('title')
    category_id = request.form.get('category_id', None)
    description = request.form.get('description', '')

    if not user_id or not title:
        return send_response(False, 'User ID and title are required')
    
    image_data = photo_file.read()
    image_type = photo_file.content_type

    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    if image_type not in allowed_types:
        return send_response(False, 'Incorrect image type. Allowed types are JPEG, JPG, PNG, GIF, WEBP')
    
    connection = get_db_connection()
    if not connection :
        return send_response(False, 'Could not connect to the database')
    
    cursor = connection.cursor()

    try:
        cursor.execute ("""INSERT INTO photos (user_id, title, category_id, description, image_data, image_type) VALUES (%s, %s, %s, %s, %s, %s)""",
        (user_id, title, category_id, description, image_data, image_type))

        connection.commit()

        return send_response(True, {
            'photo_id': cursor.lastrowid,
            'message': 'Photo uploaded successfully'
        })
    
    except Exception as e :
        return send_response(False, error = f'Photo upload failed: {str(e)}')
    finally:
        cursor.close()
        connection.close()

# get photo info
@app.route('/api/photos', methods=['GET'])
def get_photos():

    user_id = request.args.get('user_id')
    category = request.args.get('category')
    search = request.args.get('search')

    connection = get_db_connection()
    if not connection :
        return send_response(False, error = 'Could not connect to the database')
    
    cursor = connection.cursor()

    try:
        query = """
            SELECT p.photo_id, p.user_id, p.title, p.description, 
                   p.image_type, p.upload_date,
                   u.username, u.full_name,
                   c.category_name,
                   LENGTH(p.image_data) as image_size
            FROM photos p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE 1=1
        """
        params = []

        if user_id:
            query += " AND p.user_id = %s"
            params.append(user_id)
        
        if category:
            query += " AND c.category_name = %s"
            params.append(category)
        
        if search:
            query += " AND (p.title LIKE %s OR p.description LIKE %s)"
            params.append(f"%{search}%")
            params.append(f"%{search}%")

        query += " ORDER BY p.upload_date DESC"
        
        cursor.execute(query, params)
        photos = cursor.fetchall()

        for photo in photos:
            if photo.get ('upload_date'):
                photo['upload_date'] = photo['upload_date'].isoformat()

        return send_response(True, photos)
    except Exception as e :
        return send_response(False, error = f'Can not get a photo: {str(e)}')
    finally:
        cursor.close()
        connection.close()
    
# get actual image
@app.route('/api/image/<int:photo_id>', methods=['GET'])
def get_image(photo_id):
    connection = get_db_connection()
    if not connection :
        return send_response(False, 'Could not connect to the database')
    
    cursor = connection.cursor()

    try:
        cursor.execute(
            "SELECT image_data, image_type FROM photos WHERE photo_id = %s",
            (photo_id,)
        )
        result = cursor.fetchone()

        if result:
            image_data = result['image_data']
            image_type = result['image_type']
            return send_file(
                io.BytesIO(image_data),
                mimetype=image_type
            )
        else:
            return "Image not found", 404

    except Exception as e :
        return f"Error: {str(e)}", 500
    finally:
        cursor.close()
        connection.close()   

@app.route('/api/categories', methods=['GET'])
def get_categories():
    connection = get_db_connection()
    if not connection :
        return send_response(False, 'Could not connect to the database')
    
    cursor = connection.cursor()

    try:
        cursor.execute("SELECT category_id, category_name FROM categories ORDER BY category_name")
        categories = cursor.fetchall()
        return send_response(True, categories)
    
    except Exception as e :
        return send_response(False, error = f'Can not get categories: {str(e)}')
    finally:
        cursor.close()
        connection.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    return send_response(True, {'status': 'Server is running'})


# run server
if __name__ == '__main__':
    print("Starting Flask server...")
    print("Server running on http://localhost:5001")
    app.run(debug=True, port=5001)



    