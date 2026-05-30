"""
KAVACH AI Pro - Deepfake Model Training (Google Colab - FREE GPU)
Train EfficientNet-B0 on 140k Real vs Fake Faces dataset

Dataset (FREE): https://www.kaggle.com/datasets/xhlulu/140k-real-and-fake-faces
Run on: Google Colab (free T4 GPU) - ~30 min training
Output: models/pretrained/deepfake_efficientnet.pth
"""
import os, sys, torch, torch.nn as nn, torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
from PIL import Image
from pathlib import Path
import numpy as np

CONFIG = {
    'dataset_path': os.path.expanduser('~/.cache/kagglehub/datasets/xhlulu/140k-real-and-fake-faces/versions/2/real_vs_fake/real-vs-fake/'),
    'model_save_path': 'models/pretrained/deepfake_efficientnet.pth',
    'batch_size': 16, 'num_epochs': 5, 'lr': 0.001,
    'image_size': 224, 'device': 'cuda' if torch.cuda.is_available() else 'cpu',
    'max_images_per_class': 2000,  # Limit for CPU training
}

class FaceDataset(Dataset):
    def __init__(self, root, split='train', transform=None):
        self.transform = transform
        self.samples = []
        for label, folder in [(0,'real'), (1,'fake')]:
            d = Path(root)/split/folder
            if d.exists():
                imgs = list(d.glob('*.[jp][pn]g'))[:CONFIG.get('max_images_per_class', 99999)]
                self.samples += [(str(p), label) for p in imgs]
        print(f"  {split}: {len(self.samples)} images")
    def __len__(self): return len(self.samples)
    def __getitem__(self, i):
        img, label = Image.open(self.samples[i][0]).convert('RGB'), self.samples[i][1]
        if self.transform: img = self.transform(img)
        return img, label

def build_model():
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    for p in list(model.parameters())[:-20]: p.requires_grad = False
    n = model.classifier[1].in_features
    model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(n,256), nn.ReLU(), nn.Dropout(0.2), nn.Linear(256,1), nn.Sigmoid())
    return model

def main():
    print("="*60+"\n🛡️ KAVACH AI - Deepfake Model Training\n"+"="*60)
    if not Path(CONFIG['dataset_path']).exists():
        print("❌ Dataset not found!\n📥 Download FREE from: https://www.kaggle.com/datasets/xhlulu/140k-real-and-fake-faces")
        print("   Or in Colab: !kaggle datasets download -d xhlulu/140k-real-and-fake-faces"); return

    t_train = transforms.Compose([transforms.Resize((224,224)), transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.2,0.2), transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
    t_val = transforms.Compose([transforms.Resize((224,224)), transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])

    train_dl = DataLoader(FaceDataset(CONFIG['dataset_path'],'train',t_train), batch_size=32, shuffle=True)
    val_dl = DataLoader(FaceDataset(CONFIG['dataset_path'],'valid',t_val), batch_size=32)

    device = torch.device(CONFIG['device'])
    model = build_model().to(device)
    criterion, optimizer = nn.BCELoss(), optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001)
    best = 0.0

    for epoch in range(CONFIG['num_epochs']):
        model.train(); loss_sum = correct = total = 0
        for imgs, labels in train_dl:
            imgs, labels = imgs.to(device), labels.float().to(device)
            optimizer.zero_grad(); out = model(imgs).squeeze(); loss = criterion(out, labels)
            loss.backward(); optimizer.step()
            loss_sum += loss.item(); correct += ((out>0.5).float()==labels).sum().item(); total += len(labels)

        model.eval(); vc = vt = 0
        with torch.no_grad():
            for imgs, labels in val_dl:
                imgs, labels = imgs.to(device), labels.float().to(device)
                out = model(imgs).squeeze(); vc += ((out>0.5).float()==labels).sum().item(); vt += len(labels)
        val_acc = vc/vt
        print(f"Epoch {epoch+1}/{CONFIG['num_epochs']} | Train Acc: {correct/total*100:.1f}% | Val Acc: {val_acc*100:.1f}%")
        if val_acc > best:
            best = val_acc; Path(CONFIG['model_save_path']).parent.mkdir(parents=True, exist_ok=True)
            torch.save({'model_state_dict': model.state_dict(), 'accuracy': val_acc, 'arch': 'efficientnet_b0'}, CONFIG['model_save_path'])
            print(f"  ✅ Saved! ({val_acc*100:.1f}%)")
    print(f"\n✨ Done! Best: {best*100:.1f}% → {CONFIG['model_save_path']}")

if __name__ == "__main__": main()
