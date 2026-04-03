import os, random, glob, numpy as np, torch, torch.nn as nn, torchaudio, warnings
warnings.filterwarnings("ignore")
from transformers import Wav2Vec2Processor, Wav2Vec2Model
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix

SEED=42; random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
BASE=os.path.abspath(".")
DATA=os.path.join(BASE,"processed_audio"); MODELS=os.path.join(BASE,"models")
LABEL2ID={"angry":0,"fear":1,"happy":2,"neutral":3,"sad":4}
ID2LABEL={v:k for k,v in LABEL2ID.items()}; CLASSES=[ID2LABEL[i] for i in range(5)]
SR=16000; ML=SR*4; BS=8; DEVICE=torch.device("cuda")

class Clf(nn.Module):
    def __init__(self):
        super().__init__()
        self.wav2vec2=Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
        self.classifier=nn.Sequential(nn.Linear(768,128),nn.ReLU(),nn.Dropout(0.3),nn.Linear(128,5))
    def forward(self,x,m=None):
        return self.classifier(self.wav2vec2(x,attention_mask=m).last_hidden_state.mean(1))

files,labels=[],[]
for e,lid in LABEL2ID.items():
    w=glob.glob(os.path.join(DATA,e,"*.wav")); files+=w; labels+=[lid]*len(w)

_,tf,_,tl=train_test_split(files,labels,test_size=0.20,stratify=labels,random_state=SEED)
testf,_,testl,_=train_test_split(tf,tl,test_size=0.50,stratify=tl,random_state=SEED)

proc=Wav2Vec2Processor.from_pretrained(os.path.join(MODELS,"processor"))
model=Clf().to(DEVICE)
model.load_state_dict(torch.load(os.path.join(MODELS,"emotion_model.pt"),map_location=DEVICE))
model.eval()

preds=[]
for i in range(0,len(testf),BS):
    bf=testf[i:i+BS]; audios=[]
    for f in bf:
        w,sr=torchaudio.load(f)
        if sr!=SR: w=torchaudio.functional.resample(w,sr,SR)
        if w.shape[0]>1: w=w.mean(0,keepdim=True)
        L=w.shape[-1]
        if L<ML: w=torch.nn.functional.pad(w,(0,ML-L))
        else: w=w[:,:ML]
        audios.append(w.squeeze().numpy())
    inp=proc(audios,sampling_rate=SR,return_tensors="pt",padding=True,return_attention_mask=True)
    with torch.no_grad():
        lg=model(inp.input_values.to(DEVICE),inp.attention_mask.to(DEVICE))
    preds+=torch.softmax(lg,1).cpu().numpy().argmax(1).tolist()

yt=np.array(testl); yp=np.array(preds)
cm=confusion_matrix(yt,yp)
pa=precision_score(yt,yp,average=None,zero_division=0)
ra=recall_score(yt,yp,average=None,zero_division=0)
fa=f1_score(yt,yp,average=None,zero_division=0)

print("ACCURACY", round(accuracy_score(yt,yp)*100, 2))
print("PRECISION", round(precision_score(yt,yp,average="weighted",zero_division=0)*100, 2))
print("RECALL",   round(recall_score(yt,yp,average="weighted",zero_division=0)*100, 2))
print("F1",       round(f1_score(yt,yp,average="weighted",zero_division=0)*100, 2))
for i,c in enumerate(CLASSES):
    acc_i = round(cm[i,i]/cm[i].sum()*100, 2)
    print(f"CLASS {c} p={round(pa[i]*100,2)} r={round(ra[i]*100,2)} f1={round(fa[i]*100,2)} acc={acc_i}")
print("CM", cm.tolist())
