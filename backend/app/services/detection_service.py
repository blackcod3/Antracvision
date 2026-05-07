from app.core.model_loader import model

def predict_image(img_array):

    results = model(img_array)

    probs = results[0].probs

    top_class = probs.top1

    confidence = float(probs.top1conf)

    class_names = {
        0: "Antracnosis",
        1: "Sana"
    }

    clase = class_names.get(top_class, "Desconocida")

    return clase, confidence