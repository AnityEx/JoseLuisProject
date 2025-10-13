from rapidocr import RapidOCR

engine = RapidOCR()

img_url = "https://f.rpp-noticias.io/2021/06/04/1103509analisis-smsjpg.jpg"
result = engine(img_url)
print(result)

result.vis("vis_result.jpg")