import React, { useContext, useState, useEffect, useReducer, useRef } from "react";
import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";
import { isNil } from "lodash";
import { blue, green } from "@material-ui/core/colors";
import {
  Button,
  Divider,
  Typography,
  IconButton,
  makeStyles
} from "@material-ui/core";

import {
  AccessTime,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Facebook,
  Instagram,
  Reply,
  WhatsApp
} from "@material-ui/icons";
import LockIcon from '@material-ui/icons/Lock';
import MarkdownWrapper from "../MarkdownWrapper";
import VcardPreview from "../VcardPreview";
import LocationPreview from "../LocationPreview";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";
import YouTubePreview from "../ModalYoutubeCors";
import PdfPreview from "../PdfPreview";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import AdMetaPreview from "../AdMetaPreview";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import SelectMessageCheckbox from "./SelectMessageCheckbox";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { AuthContext } from "../../context/Auth/AuthContext";
import { QueueSelectedContext } from "../../context/QueuesSelected/QueuesSelectedContext";
import AudioModal from "../AudioModal";
import { CircularProgress } from "@material-ui/core";
import { useParams, useHistory } from 'react-router-dom';
import { downloadResource } from "../../utils";
import Template from "./templates";
import { usePdfViewer } from "../../hooks/usePdfViewer";

const useStyles = makeStyles((theme) => ({
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },

  currentTick: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "95%",
    backgroundColor: theme.palette.primary.main,
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "1px 5px 10px #b3b3b3",
  },

  currentTicktText: {
    color: theme.palette.primary,
    fontWeight: 'bold',
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  messagesList: {
    backgroundImage: theme.mode === 'light' ? `url(${whatsBackground})` : `url(${whatsBackgroundDark})`,
    backgroundColor: theme.mode === 'light' ? "transparent" : "#0b0b0d",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 30px 20px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  dragElement: {
    background: 'rgba(255, 255, 255, 0.8)',
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 999999,
    textAlign: "center",
    fontSize: "3em",
    border: "5px dashed #333",
    color: '#333',
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  circleLoading: {
    color: blue[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: theme.mode === 'light' ? "#ffffff" : "#202c33",
    color: theme.mode === 'light' ? "#303030" : "#ffffff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: theme.mode === 'light' ? "#f0f0f0" : "#1d282f",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#388aff",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: theme.mode === 'light' ? "#dcf8c6" : "#005c4b",
    color: theme.mode === 'light' ? "#303030" : "#ffffff",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  messageRightPrivate: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: "#F0E68C",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: theme.mode === 'light' ? "#cfe9ba" : "#025144",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  messageMedia: {
    // ✅ CORREÇÃO: objectFit removido para vídeos funcionarem melhor
    // objectFit: "cover", // Removido pois pode causar problemas em vídeos
    width: 400,
    height: "auto",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // ✅ CORREÇÃO: Adicionar estilos específicos para vídeo
    "&[controls]": {
      objectFit: "contain", // Para vídeos, usar contain em vez de cover
    }
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },

  forwardMessage: {
    fontSize: 12,
    fontStyle: "italic",
    position: "absolute",
    top: 0,
    left: 5,
    color: "#999",
    display: "flex",
    alignItems: "center"
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: blue[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  ackPlayedIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },
  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
    color: theme.mode === "light" ? theme.palette.light : theme.palette.dark,
  },

  messageCenter: {
    marginTop: 5,
    alignItems: "center",
    verticalAlign: "center",
    alignContent: "center",
    backgroundColor: "#E1F5FEEB",
    fontSize: "12px",
    minWidth: 100,
    maxWidth: 270,
    color: "#272727",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  deletedMessage: {
    color: '#f55d65'
  }
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];

    messages.forEach((message) => {

      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({
  isGroup,
  onDrop,
  whatsappId,
  queueId,
  channel,
  ticketStatus
}) => {
  const classes = useStyles();
  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const history = useHistory();
  const lastMessageRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const { ticketId } = useParams();

  const currentTicketId = useRef(ticketId);
  const { getAll } = useCompanySettings();
  const [dragActive, setDragActive] = useState(false);
  const [dragTimeout, setDragTimeout] = useState(null);

  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const [lgpdDeleteMessage, setLGPDDeleteMessage] = useState(false);
  const { selectedQueuesMessage } = useContext(QueueSelectedContext);

  // Hook simplificado para PDF
  const {
    downloadPdf,
    extractPdfInfoFromMessage,
    isPdfUrl
  } = usePdfViewer();

  const { showSelectMessageCheckbox } = useContext(ForwardMessageContext);
  const { user, socket } = useContext(AuthContext);
  const companyId = user.companyId;

  useEffect(() => {
    async function fetchData() {
      const settings = await getAll(companyId);

      let settinglgpdDeleteMessage;
      let settingEnableLGPD;

      for (const [key, value] of Object.entries(settings)) {
        if (key === "lgpdDeleteMessage") settinglgpdDeleteMessage = value
        if (key === "enableLGPD") settingEnableLGPD = value
      }
      if (settingEnableLGPD === "enabled" && settinglgpdDeleteMessage === "enabled") {
        setLGPDDeleteMessage(true);
      }
    }
    fetchData();
  }, [])

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    currentTicketId.current = ticketId;
  }, [ticketId, selectedQueuesMessage]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === "undefined") {
          history.push("/tickets");
          return;
        }
        if (isNil(ticketId)) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber, selectedQueues: JSON.stringify(selectedQueuesMessage) },
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
            setHasMore(data.hasMore);
            setLoading(false);
            setLoadingMore(false);
          }

          if (pageNumber === 1 && data.messages.length > 1) {
            scrollToBottom();
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
          setLoadingMore(false);
        }
      };

      fetchMessages();
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId, selectedQueuesMessage]);

  useEffect(() => {
    if (ticketId === "undefined") {
      return;
    }

    const companyId = user.companyId;

    const connectEventMessagesList = () => {
      socket.emit("joinChatBox", `${ticketId}`);
    }

    const onAppMessageMessagesList = (data) => {
      if (data.action === "create" && data.ticket.uuid === ticketId) {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update" && data?.message?.ticket?.uuid === ticketId) {
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
      }

      if (data.action == "delete" && data.message.ticket?.uuid === ticketId) {
        dispatch({ type: "DELETE_MESSAGE", payload: data.messageId });
      }
    }
    socket.on("connect", connectEventMessagesList);
    socket.on(`company-${companyId}-appMessage`, onAppMessageMessagesList);

    return () => {
      socket.emit("joinChatBoxLeave", `${ticketId}`)
      socket.off("connect", connectEventMessagesList);
      socket.off(`company-${companyId}-appMessage`, onAppMessageMessagesList);
    };

  }, [ticketId]);

  useEffect(() => {
    return () => {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
    };
  }, [dragTimeout]);

  const loadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({});
      }
    }, 100);
  };

  const handleScroll = (e) => {
    if (!hasMore) return;
    const { scrollTop } = e.currentTarget;

    if (scrollTop === 0) {
      document.getElementById("messagesList").scrollTop = 1;
    }

    if (loading) {
      return;
    }

    if (scrollTop < 50) {
      loadMore();
    }
  };

  const handleOpenMessageOptionsMenu = (e, message) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const hanldeReplyMessage = (e, message) => {
    setAnchorEl(null);
    setReplyingMessage(message);
  };

  const checkMessageMedia = (message) => {
    const isAudioMessage = (message) => {
      if (message.mediaType === "audio") {
        console.log("🎵 Detectado como áudio pelo mediaType:", message.mediaType);
        return true;
      }

      if (message.mediaUrl) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'];
        const url = message.mediaUrl.toLowerCase();
        const hasAudioExtension = audioExtensions.some(ext => url.includes(ext));

        if (hasAudioExtension) {
          console.log("🎵 Detectado como áudio pela URL:", url);
          return true;
        }
      }

      if (message.body && typeof message.body === 'string') {
        const body = message.body.toLowerCase();
        const isAudioBody = body.includes('áudio gravado') ||
          body.includes('audio_') ||
          body.includes('🎵') ||
          body.includes('arquivo de áudio') ||
          body.includes('mensagem de voz');

        if (isAudioBody) {
          console.log("🎵 Detectado como áudio pelo body:", body);
          return true;
        }
      }

      return false;
    };

    // Templates
    if (message.mediaType === "template") {
      return <Template message={message} />;
    }

    // Localização
    else if (message.mediaType === "locationMessage" && message.body.split('|').length >= 2) {
      let locationParts = message.body.split('|');
      let imageLocation = locationParts[0];
      let linkLocation = locationParts[1];
      let descriptionLocation = locationParts.length > 2 ? locationParts[2] : null;

      return <LocationPreview 
        image={imageLocation} 
        link={linkLocation} 
        description={descriptionLocation} 
      />;
    }

    // Contatos
    else if (message.mediaType === "contactMessage") {
      let array = message.body.split("\n");
      let obj = [];
      let contact = "";
      
      for (let index = 0; index < array.length; index++) {
        const v = array[index];
        let values = v.split(":");
        for (let ind = 0; ind < values.length; ind++) {
          if (values[ind].indexOf("+") !== -1) {
            obj.push({ number: values[ind] });
          }
          if (values[ind].indexOf("FN") !== -1) {
            contact = values[ind + 1];
          }
        }
      }
      
      return <VcardPreview 
        contact={contact} 
        numbers={obj[0]?.number} 
        queueId={message?.ticket?.queueId} 
        whatsappId={message?.ticket?.whatsappId} 
        channel={channel} 
      />;
    }

    else if (message.mediaType === "adMetaPreview") { // Adicionado para renderizar o componente de preview de anúncio
      console.log("Entrou no MetaPreview");
      // ✅ CORREÇÃO: Parse correto dos dados - formato: image|sourceUrl|title|body|messageUser
      let [image, sourceUrl, title, body, messageUser] = message.body.split('|');
      
      // Fallback para messageUser se não estiver presente
      if (!messageUser || messageUser.trim() === "") {
        messageUser = "Olá! Tenho interesse e queria mais informações, por favor.";
      }
      
      return <AdMetaPreview 
        image={image} 
        sourceUrl={sourceUrl} 
        title={title} 
        body={body} 
        messageUser={messageUser} 
      />;
    }

    // PDF e Documentos - SÓ DOWNLOAD
    else if (isPdfUrl(message.mediaUrl, message.body, message.mediaType)) {
      
      console.log("📄 Renderizando como documento/PDF:", message.id);
      const pdfInfo = extractPdfInfoFromMessage(message);

      return (
        <PdfPreview
          url={pdfInfo.url}
          filename={pdfInfo.filename}
          size={pdfInfo.size}
          mediaType={pdfInfo.mediaType}
          onDownload={(url, name) => {
            console.log("📥 Download PDF solicitado:", { url, name });
            downloadPdf(url, name);
          }}
        />
      );
    }

    // Áudio
    else if (isAudioMessage(message)) {
      console.log("🎵 Renderizando como áudio:", message.id);
      return (
        <div style={{
          width: '100%',
          maxWidth: '300px',
          padding: '8px',
          backgroundColor: 'transparent'
        }}>
          <AudioModal
            url={message.mediaUrl}
            message={message}
          />
        </div>
      );
    }

    // Imagens
    else if (message.mediaType === "image") {
      console.log("🖼️ Renderizando como imagem");
      return <ModalImageCors imageUrl={message.mediaUrl} />;
    }

    // Vídeos
    else if (message.mediaType === "video") {
      console.log("🎥 Renderizando como vídeo");
      
      return (
        <div style={{ maxWidth: "400px", width: "100%", position: "relative" }}>
          {/* Loading indicator */}
          {videoLoading && !videoError && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px"
            }}>
              <CircularProgress size={30} />
              <Typography variant="caption" color="textSecondary">
                Carregando vídeo...
              </Typography>
            </div>
          )}
          
          {/* Vídeo player melhorado */}
          <video
            className={classes.messageMedia}
            src={message.mediaUrl}
            controls
            preload="metadata"
            playsInline
            style={{ 
              width: "100%", 
              height: "auto", 
              maxHeight: "300px",
              borderRadius: "8px",
              backgroundColor: "#f0f0f0",
              opacity: videoLoading ? 0.3 : 1,
              transition: "opacity 0.3s ease"
            }}
            onLoadStart={() => {
              console.log("⏳ Iniciando carregamento do vídeo");
              setVideoLoading(true);
              setVideoError(false);
            }}
            onLoadedData={() => {
              console.log("✅ Vídeo carregado e pronto");
              setVideoLoading(false);
            }}
            onCanPlay={() => {
              console.log("✅ Vídeo pronto para reprodução");
              setVideoLoading(false);
            }}
            onError={(e) => {
              console.error("❌ Erro ao carregar vídeo:", e);
              console.log("🔗 URL do vídeo:", message.mediaUrl);
              setVideoLoading(false);
              setVideoError(true);
            }}
          >
            {/* ✅ CORREÇÃO: Múltiplos formatos para compatibilidade */}
            <source src={message.mediaUrl} type="video/mp4" />
            <source src={message.mediaUrl} type="video/webm" />
            <source src={message.mediaUrl} type="video/ogg" />
            
            {/* Fallback para navegadores antigos */}
            Seu navegador não suporta reprodução de vídeo.
          </video>
          
          {/* Error state */}
          {videoError && (
            <div style={{ 
              padding: "20px", 
              textAlign: "center", 
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              color: "#666",
              marginTop: "8px"
            }}>
              <Typography variant="body2" style={{ marginBottom: "12px" }}>
                ❌ Erro ao carregar vídeo
              </Typography>
              <Button
                startIcon={<GetApp />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = message.mediaUrl;
                  link.download = message.body || 'video.mp4';
                  link.click();
                }}
                variant="outlined"
                size="small"
              >
                Baixar Vídeo
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Outros tipos de arquivo
    else if (message.mediaUrl) {
      console.log("📎 Renderizando como download genérico");
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              variant="outlined"
              onClick={() => downloadPdf(message.mediaUrl, message.body || 'arquivo')}
            >
              Download
            </Button>
          </div>
          <Divider />
        </>
      );
    }

    return null;
  };

  const renderMessageAck = (message) => {
    if (message.ack === 0) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    } else
      if (message.ack === 1) {
        return <Done fontSize="small" className={classes.ackIcons} />;
      } else
        if (message.ack === 2) {
          return <DoneAll fontSize="small" className={classes.ackIcons} />;
        } else
          if (message.ack === 3 || message.ack === 4) {
            return <DoneAll fontSize="small" className={message.mediaType === "audio" ? classes.ackPlayedIcon : classes.ackDoneAllIcon} />;
          } else
            if (message.ack === 5) {
              return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
            }
  };

  const renderDailyTimestamps = (message, index) => {
    const today = format(new Date(), "dd/MM/yyyy")

    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {today === format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy") ? "HOJE" : format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    } else
      if (index < messagesList.length - 1) {
        let messageDay = parseISO(messagesList[index].createdAt);
        let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

        if (!isSameDay(messageDay, previousMessageDay)) {
          return (
            <span
              className={classes.dailyTimestamp}
              key={`timestamp-${message.id}`}
            >
              <div className={classes.dailyTimestampText}>
                {today === format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy") ? "HOJE" : format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
              </div>
            </span>
          );
        }
      } else
        if (index === messagesList.length - 1) {
          return (
            <div
              key={`ref-${message.id}`}
              ref={lastMessageRef}
              style={{ float: "left", clear: "both" }}
            />
          );
        }
  };

  const renderTicketsSeparator = (message, index) => {
    let lastTicket = messagesList[index - 1]?.ticketId;
    let currentTicket = message.ticketId;

    if (lastTicket !== currentTicket && lastTicket !== undefined) {
      if (message?.ticket?.queue) {
        return (
          <span
            className={classes.currentTick}
            key={`timestamp-${message.id}a`}
          >
            <div
              className={classes.currentTicktText}
              style={{ backgroundColor: message?.ticket?.queue?.color || "grey" }}
            >
              #{i18n.t("ticketsList.called")} {message?.ticketId} - {message?.ticket?.queue?.name}
            </div>

          </span>
        );
      } else {
        return (
          <span
            className={classes.currentTick}
            key={`timestamp-${message.id}b`}
          >
            <div
              className={classes.currentTicktText}
              style={{ backgroundColor: "grey" }}
            >
              #{i18n.t("ticketsList.called")} {message.ticketId} - {i18n.t("ticketsList.noQueue")}
            </div>

          </span>
        );
      }
    }

  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;
      if (messageUser !== previousMessageUser) {
        return (

          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const path = require('path');

  const renderQuotedMessage = (message) => {

    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}

          {message.quotedMsg.mediaType === "audio"
            && (
              <div className={classes.downloadMedia}>
                <AudioModal url={message.quotedMsg.mediaUrl} />
              </div>
            )
          }
          {message.quotedMsg.mediaType === "video"
            && (
              <div style={{ maxWidth: "300px", width: "100%" }}>
                <video
                  className={classes.messageMedia}
                  src={message.quotedMsg.mediaUrl}
                  controls
                  preload="metadata"
                  style={{ 
                    width: "100%", 
                    height: "auto", 
                    maxHeight: "200px",
                    borderRadius: "6px",
                    backgroundColor: "#f0f0f0"
                  }}
                  onError={(e) => {
                    console.error("❌ Erro ao carregar vídeo citado:", e);
                  }}
                >
                  <source src={message.quotedMsg.mediaUrl} type="video/mp4" />
                  <source src={message.quotedMsg.mediaUrl} type="video/webm" />
                  <source src={message.quotedMsg.mediaUrl} type="video/ogg" />
                  <div style={{ padding: "10px", textAlign: "center", fontSize: "12px", color: "#999" }}>
                    ❌ Erro ao carregar vídeo
                  </div>
                </video>
              </div>
            )
          }
          {message.quotedMsg.mediaType === "contactMessage"
            && (
              "Contato"
            )
          }
          {message.quotedMsg.mediaType === "application"
            && (
              <div className={classes.downloadMedia}>
                <Button
                  startIcon={<GetApp />}
                  variant="outlined"
                  target="_blank"
                  href={message.quotedMsg.mediaUrl}
                >
                  Download
                </Button>
              </div>
            )
          }

          {message.quotedMsg.mediaType === "image"
            && (
              <ModalImageCors imageUrl={message.quotedMsg.mediaUrl} />)
            || message.quotedMsg?.body}

          {!message.quotedMsg.mediaType === "image" && message.quotedMsg?.body}

        </div>
      </div>
    );
  };

  const handleDrag = event => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      const hasFiles = event.dataTransfer &&
        event.dataTransfer.types &&
        (event.dataTransfer.types.includes('Files') ||
          event.dataTransfer.types.includes('application/x-moz-file'));

      if (hasFiles) {
        if (dragTimeout) {
          clearTimeout(dragTimeout);
        }

        const timeout = setTimeout(() => {
          if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            setDragActive(true);
          }
        }, 100);

        setDragTimeout(timeout);
      }
    } else if (event.type === "dragleave") {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        setDragTimeout(null);
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragActive(false);
      }
    }
  }

  const isYouTubeLink = (url) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  };

  const handleDrop = event => {
    event.preventDefault();
    event.stopPropagation();

    if (dragTimeout) {
      clearTimeout(dragTimeout);
      setDragTimeout(null);
    }

    setDragActive(false);

    if (event.dataTransfer.files &&
      event.dataTransfer.files.length > 0 &&
      event.dataTransfer.files[0] instanceof File) {
      if (onDrop) {
        onDrop(event.dataTransfer.files);
      }
    }
  }
  const xmlRegex = /<([^>]+)>/g;
  const boldRegex = /\*(.*?)\*/g;

  const formatXml = (xmlString) => {
    // Verifica se o XML contém a assinatura com nome do atendente
    if (boldRegex.test(xmlString)) {
      // Formata o texto dentro da assinatura em negrito
      xmlString = xmlString.replace(boldRegex, "**$1**");
    }
    return xmlString;
  };

  const renderMessages = () => {

    if (messagesList.length > 0) {
      const viewMessagesList = messagesList.map((message, index) => {
        if (message.mediaType === "call_log") {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderTicketsSeparator(message, index)}
              {renderMessageDivider(message, index)}
              <div className={classes.messageCenter}>
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}

                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 17" width="20" height="17">
                    <path fill="#df3333" d="M18.2 12.1c-1.5-1.8-5-2.7-8.2-2.7s-6.7 1-8.2 2.7c-.7.8-.3 2.3.2 2.8.2.2.3.3.5.3 1.4 0 3.6-.7 3.6-.7.5-.2.8-.5.8-1v-1.3c.7-1.2 5.4-1.2 6.4-.1l.1.1v1.3c0 .2.1.4.2.6.1.2.3.3.5.4 0 0 2.2.7 3.6.7.2 0 1.4-2 .5-3.1zM5.4 3.2l4.7 4.6 5.8-5.7-.9-.8L10.1 6 6.4 2.3h2.5V1H4.1v4.8h1.3V3.2z"></path>
                  </svg> <span>{i18n.t("ticketsList.missedCall")} {format(parseISO(message.createdAt), "HH:mm")}</span>
                </div>
              </div>
            </React.Fragment>
          );
        }

        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderTicketsSeparator(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={classes.messageLeft}
                title={message.queueId && message.queue?.name}
                onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              >
                {showSelectMessageCheckbox && (
                  <SelectMessageCheckbox
                    message={message}
                  />
                )}
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>

                {message.isForwarded && (
                  <div>
                    <span className={classes.forwardMessage}
                    ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                    </span>
                    <br />
                  </div>
                )}
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}
                {isYouTubeLink(message.body) && (
                  <>
                    <YouTubePreview videoUrl={message.body} />
                  </>
                )}

                {!lgpdDeleteMessage && message.isDeleted && (
                  <div>
                    <span className={classes.deletedMessage}
                    >🚫 Essa mensagem foi apagada pelo contato &nbsp;
                    </span>
                  </div>
                )}

                {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "contactMessage" || message.mediaType === "template" || message.mediaType === "adMetaPreview"
                ) && checkMessageMedia(message)}

                <div className={clsx(classes.textContentItem, {
                  [classes.textContentItemDeleted]: message.isDeleted,
                })}>
                  {message.quotedMsg && renderQuotedMessage(message)}
                  {
                    message.mediaType !== "adMetaPreview" && (
                      (message.mediaUrl !== null && (message.mediaType === "image" || message.mediaType === "video") && path.basename(message.mediaUrl).trim() !== message.body.trim()) ||
                      message.mediaType !== "audio" &&
                      message.mediaType !== "image" &&
                      message.mediaType !== "video" &&
                      message.mediaType != "reactionMessage" &&
                      message.mediaType != "locationMessage" &&
                      message.mediaType !== "contactMessage" &&
                      message.mediaType !== "template"
                    ) && (
                      <>
                        {xmlRegex.test(message.body) && (
                          <span>{message.body}</span>

                        )}
                        {!xmlRegex.test(message.body) && (
                          <MarkdownWrapper>{(lgpdDeleteMessage && message.isDeleted) ? "🚫 _Mensagem apagada_ " :
                            message.body
                          }</MarkdownWrapper>)}

                      </>

                    )}

                  {message.quotedMsg && message.mediaType === "reactionMessage" && (
                    <>
                      <span style={{ marginLeft: "0px" }}>
                        <MarkdownWrapper>
                          {"" + message?.contact?.name + " reagiu... " + message.body}
                        </MarkdownWrapper>
                      </span>
                    </>
                  )}

                  <span className={classes.timestamp}>
                    {message.isEdited ? "Editada " + format(parseISO(message.createdAt), "HH:mm") : format(parseISO(message.createdAt), "HH:mm")}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderTicketsSeparator(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={message.isPrivate ? classes.messageRightPrivate : classes.messageRight}
                title={message.queueId && message.queue?.name}
                onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              >
                {showSelectMessageCheckbox && (
                  <SelectMessageCheckbox
                    message={message}
                  />
                )}

                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {message.isForwarded && (
                  <div>
                    <span className={classes.forwardMessage}
                    ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                    </span>
                    <br />
                  </div>
                )}
                {isYouTubeLink(message.body) && (
                  <>
                    <YouTubePreview videoUrl={message.body} />
                  </>
                )}
                {!lgpdDeleteMessage && message.isDeleted && (
                  <div>
                    <span className={classes.deletedMessage}
                    >🚫 Essa mensagem foi apagada &nbsp;
                    </span>
                  </div>
                )}
                {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "contactMessage" || message.mediaType === "template"
                ) && checkMessageMedia(message)}
                <div
                  className={clsx(classes.textContentItem, {
                    [classes.textContentItemDeleted]: message.isDeleted,
                  })}
                >

                  {message.quotedMsg && renderQuotedMessage(message)}

                  {
                    ((message.mediaType === "image" || message.mediaType === "video") && path.basename(message.mediaUrl) === message.body) ||
                    (message.mediaType !== "audio" && message.mediaType != "reactionMessage" && message.mediaType != "locationMessage" && message.mediaType !== "contactMessage" && message.mediaType !== "template") && (
                      <>
                        {xmlRegex.test(message.body) && (
                          <div>{formatXml(message.body)}</div>

                        )}
                        {!xmlRegex.test(message.body) && (<MarkdownWrapper>{message.body}</MarkdownWrapper>)}

                      </>
                    )}

                  {message.quotedMsg && message.mediaType === "reactionMessage" && (
                    <>
                      <span style={{ marginLeft: "0px" }}>
                        <MarkdownWrapper>
                          {"Você reagiu... " + message.body}
                        </MarkdownWrapper>
                      </span>
                    </>
                  )}

                  <span className={classes.timestamp}>
                    {message.isEdited ? "Editada " + format(parseISO(message.createdAt), "HH:mm") : format(parseISO(message.createdAt), "HH:mm")}
                    {renderMessageAck(message)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        }
      });
      return viewMessagesList;
    } else {
      return <div>Diga olá para seu novo contato!</div>;
    }
  };
const shouldBlurMessages = ticketStatus === "pending" && user.allowSeeMessagesInPendingTickets === "disabled";

  return (
    <div className={classes.messagesListWrapper} onDragEnter={handleDrag}>
      {dragActive && <div className={classes.dragElement} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>Solte o arquivo aqui</div>}
      <MessageOptionsMenu
        message={selectedMessage}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
        isGroup={isGroup}
        whatsappId={whatsappId}
        queueId={queueId}
      />
      

<div
  id="messagesList"
  className={classes.messagesList}
  onScroll={handleScroll}
  style={{
    filter: shouldBlurMessages ? "blur(4px)" : "none",
    pointerEvents: shouldBlurMessages ? "none" : "auto"
  }}
>
  {messagesList.length > 0 ? renderMessages() : []}
</div>

      {(channel !== "whatsapp" && channel !== undefined) && (
        <div
          style={{
            width: "100%",
            display: "flex",
            padding: "10px",
            alignItems: "center",
            backgroundColor: "#E1F3FB",
          }}
        >
          {channel === "facebook" ? (
            <Facebook />
          ) : channel === "instagram" ? (
            <Instagram />
          ) : (
            <WhatsApp />
          )}

          <span>
            Você tem 24h para responder após receber uma mensagem, de acordo
            com as políticas da Meta.
          </span>
        </div>
      )}
      
      {loading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
    </div>
  );
};

export default MessagesList;