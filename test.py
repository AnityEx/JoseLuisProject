
import requests

url = 'http://localhost:9003/ocr'
img = 'https://www.olyfed.com/wp-content/uploads/2023/10/TextScam-768x521.jpg'

#https://www.eldebate.com/files/article_social/uploads/2022/04/15/6259ddb4a57bd.png
#https://www.olyfed.com/wp-content/uploads/2023/10/TextScam-768x521.jpg

# Download the image from URL
temp_img = requests.get(img)
temp_img.raise_for_status()

# Prepare file dict for POST request
file_dict = {
    'image_file': ('imagentemporal.png', temp_img.content, 'image/png')
}

# Send the image to your OCR server
response = requests.post(url, files=file_dict, timeout=60)

print(response.json())
