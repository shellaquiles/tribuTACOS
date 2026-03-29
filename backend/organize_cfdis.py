import os
import glob
import zipfile
import xml.etree.ElementTree as ET
import shutil

TARGET_DIRS = [
    "/home/kubrick/www/declara/cfdi_emitidos",
    "/home/kubrick/www/declara/cfdi_recibidos"
]

def process_directory(directory):
    print(f"Processing directory: {directory}")
    
    # 1. Extract ZIPs
    zip_files = glob.glob(os.path.join(directory, "*.zip")) + glob.glob(os.path.join(directory, "*.ZIP"))
    for zip_path in zip_files:
        print(f"  Extracting {zip_path}")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(directory)
        except Exception as e:
            print(f"  Error extracting {zip_path}: {e}")

    # 2. Process XMLs & PDFs
    for root_dir, dirs, files in os.walk(directory):
        for f in files:
            if f.lower().endswith(".xml"):
                file_path = os.path.join(root_dir, f)
                organize_xml(file_path, directory)

def organize_xml(file_path, base_dir):
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Determine if it's a Comprobante
        tag = root.tag
        if not tag.endswith('Comprobante') and not tag.endswith('Retenciones'):
            # Some CFDIs might be Retenciones, let's just accept Comprobante for now
            if not tag.endswith('Comprobante'):
                return
            
        fecha = root.attrib.get('Fecha')
        if not fecha:
            return
            
        year = fecha.split('-')[0]
        if not year.isdigit() or len(year) != 4:
            return
            
        target_dir = os.path.join(base_dir, year)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
            
        target_path = os.path.join(target_dir, os.path.basename(file_path))
        
        # Move XML
        if os.path.abspath(file_path) != os.path.abspath(target_path):
            if os.path.exists(target_path):
                # Duplicate file, just remove the unorganized one
                os.remove(file_path)
            else:
                shutil.move(file_path, target_path)
                print(f"  Moved XML {os.path.basename(file_path)} to {year}/")
                
        # Move corresponding PDF if it exists
        pdf_path = os.path.splitext(file_path)[0] + ".pdf"
        pdf_path_upper = os.path.splitext(file_path)[0] + ".PDF"
        
        for p in [pdf_path, pdf_path_upper]:
            if os.path.exists(p):
                pdf_target = os.path.join(target_dir, os.path.basename(p))
                if os.path.abspath(p) != os.path.abspath(pdf_target):
                    if os.path.exists(pdf_target):
                        os.remove(p)
                    else:
                        shutil.move(p, pdf_target)
                        print(f"  Moved PDF {os.path.basename(p)} to {year}/")
                        
    except ET.ParseError:
        print(f"  Parse error for {file_path}")
    except Exception as e:
        print(f"  Error processing {file_path}: {e}")

if __name__ == '__main__':
    for d in TARGET_DIRS:
        if os.path.exists(d):
            process_directory(d)
        else:
            print(f"Directory {d} does not exist.")
